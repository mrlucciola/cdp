use anchor_lang::prelude::*;
use anchor_spl::token::{self,  Transfer, MintTo, Burn};

use crate::{
    instructions::*,
    utils::*,
    constant::*,
    error::*,
};

impl<'info> CreateTrove<'info> {
    /// Claims rewards from saber farm
    pub fn create(&mut self, 
        trove_nonce: u8,
        ata_trove_nonce: u8, 
        ceiling: u64,
    ) -> ProgramResult {
        self.trove.locked_coll_balance = 0;
        self.trove.debt = 0;
        self.trove.trove_nonce = trove_nonce;
        self.trove.ata_trove_nonce = ata_trove_nonce;
        self.trove.debt_ceiling = ceiling;

        Ok(())
    }
}

impl<'info> CreateUserRewardVault<'info> {
    /// Claims rewards from saber farm
    pub fn create(&mut self
    ) -> ProgramResult {

        self.vault.reward_mint_a = self.reward_mint.key();
        Ok(())
    }
}

impl<'info> RatioStaker<'info> {
    /// Claims rewards from saber farm
    pub fn deposit(&mut self, amount: u64, ) -> ProgramResult {

    
        assert_tvl_allowed(self.global_state.tvl_limit, self.global_state.tvl, amount)?;
        
        // transfer from user to pool
        let cpi_accounts = Transfer {
            from: self.ata_user_coll.to_account_info().clone(),
            to: self.ata_trove.to_account_info().clone(),
            authority: self.authority.to_account_info().clone(),
        };

        let cpi_program = self.token_program.to_account_info().clone();
        
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, amount)?;

        self.vault.total_coll += amount;
        self.trove.locked_coll_balance += amount;
        self.global_state.tvl += amount;

        Ok(())
    }
    pub fn withdraw(&mut self, amount: u64, ) -> ProgramResult {
    
        let mut _amount = amount;
        if amount > self.trove.locked_coll_balance {
            _amount = self.trove.locked_coll_balance;
        }
        
        // transfer from pool to user
        let cpi_accounts = Transfer {
            from: self.ata_trove.to_account_info(),
            to: self.ata_user_coll.to_account_info(),
            authority: self.trove.to_account_info(),
        };
    
        let cpi_program = self.token_program.to_account_info();
    
        let signer_seeds = &[
            TROVE_SEED,
            self.vault.to_account_info().key.as_ref(), 
            self.authority.to_account_info().key.as_ref(),
            &[self.trove.trove_nonce],
        ];
        let signer = &[&signer_seeds[..]];
    
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, _amount)?;
    
        self.vault.total_coll -= amount;
        self.trove.locked_coll_balance -= _amount;
        self.global_state.tvl -= amount;
    
        Ok(())
    }
}

impl<'info> HarvestReward<'info> {
    pub fn harvest(&mut self) -> ProgramResult {
        
        self.trove_reward.reload()?;
        let fee_info = calculate_fee(self.trove_reward.amount, self.global_state.fee_num, self.global_state.fee_deno)?;
        
        require!(fee_info.new_amount > 0, StablePoolError::InvalidTransferAmount);
        require!(fee_info.owner_fee > 0, StablePoolError::InvalidTransferAmount);

        let authority_seeds = &[
            TROVE_SEED,
            self.vault.to_account_info().key.as_ref(), 
            self.authority.to_account_info().key.as_ref(),
            &[self.trove.trove_nonce],
        ];
        token::transfer(CpiContext::new(
            self.token_program.to_account_info(), 
            Transfer {
                from: self.trove_reward.to_account_info(),
                to: self.user_reward_token.to_account_info(),
                authority: self.trove.to_account_info(),
            }).with_signer(&[&authority_seeds[..]]), 
            fee_info.new_amount
        )?;

        token::transfer(CpiContext::new(
            self.token_program.to_account_info(), 
            Transfer {
                from: self.trove_reward.to_account_info(),
                to: self.reward_fee_token.to_account_info(),
                authority: self.trove.to_account_info(),
            }).with_signer(&[&authority_seeds[..]]), 
            fee_info.owner_fee
        )?;

        Ok(())
    }
}

impl<'info> BorrowUsd<'info> {
    pub fn borrow(&mut self,
        amount: u64,
        user_usd_token_nonce: u8,
    ) -> ProgramResult {
        let lp_price = self.price_feed.price;
        assert_debt_allowed(self.trove.locked_coll_balance, self.trove.debt, amount, lp_price)?;
        assert_vault_debt_ceiling_not_exceeded(self.vault.debt_ceiling, self.vault.total_debt, amount)?;
        assert_global_debt_ceiling_not_exceeded(self.global_state.debt_ceiling, self.global_state.total_debt, amount)?;
        assert_user_debt_ceiling_not_exceeded(self.trove.debt_ceiling, self.trove.debt, amount)?;
        
        let cur_timestamp = self.clock.unix_timestamp as u64;

        assert_limit_mint(cur_timestamp, self.trove.last_mint_time)?;
        // mint to user
        let cpi_accounts = MintTo {
            mint: self.mint_usd.to_account_info().clone(),
            to: self.ata_user_usd.to_account_info().clone(),
            authority: self.global_state.to_account_info().clone(),
        };

        let cpi_program = self.token_program.to_account_info().clone();

        let signer_seeds = &[
            GLOBAL_STATE_SEED,
            &[self.global_state.global_state_nonce],
        ];
        let signer = &[&signer_seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::mint_to(cpi_ctx, amount)?;

        self.vault.total_debt += amount;
        self.global_state.total_debt += amount;
        self.trove.debt += amount;
        self.trove.last_mint_time = cur_timestamp;
        self.trove.user_usd_nonce = user_usd_token_nonce;

        Ok(())
    }
}


impl<'info> RepayUsd<'info> {
    pub fn repay(&mut self,
        amount: u64,
    ) -> ProgramResult {
        let mut _amount = amount;
        if self.trove.debt < amount {
            _amount = self.trove.debt;
        }
        // burn
        let cpi_accounts = Burn {
            mint: self.mint_usd.to_account_info().clone(),
            to: self.ata_user_usd.to_account_info().clone(),
            authority: self.owner.to_account_info().clone(),
        };

        let cpi_program = self.token_program.to_account_info().clone();

        let signer_seeds = &[
            GLOBAL_STATE_SEED,
            &[self.global_state.global_state_nonce],
        ];
        let signer = &[&signer_seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::burn(cpi_ctx, _amount)?;

        self.vault.total_debt -= _amount;
        self.global_state.total_debt -= _amount;
        self.trove.debt -= _amount;

        Ok(())
    }
}



impl<'info> CreatePriceFeed<'info> {
    pub fn create_price_feed(&mut self,
        pair_count: u8,
    ) -> ProgramResult {
        let price_feed = &mut self.price_feed;
        price_feed.mint_coll = self.mint_coll.key();
        price_feed.mint_a = self.mint_a.key();
        price_feed.mint_b = self.mint_b.key();
        price_feed.mint_c = self.mint_c.key();
        price_feed.vault_a = self.vault_a.key();
        price_feed.vault_b = self.vault_b.key();
        price_feed.vault_c = self.vault_c.key();
        price_feed.decimals_a = self.mint_a.decimals;
        price_feed.decimals_b = self.mint_b.decimals;
        price_feed.decimals_c = self.mint_c.decimals;
        price_feed.pair_count = pair_count;
        price_feed.last_updated_time = self.clock.unix_timestamp as u64;

        let mut lp_price = 0;
        if pair_count == 2 {
            lp_price = calc_stable_usdc_pair_lp_price(
                self.mint_coll.supply, 
                self.vault_a.amount, 
                price_feed.decimals_a, 
                self.vault_b.amount, 
                price_feed.decimals_b
            );
        }
        else if pair_count == 3 {
            lp_price = calc_stable_usdc_3pair_lp_price(
                self.mint_coll.supply, 
                self.vault_a.amount, 
                price_feed.decimals_a, 
                self.vault_b.amount, 
                price_feed.decimals_b,
                self.vault_c.amount, 
                price_feed.decimals_c
            );
        }
        else {
            return Err(StablePoolError::NotAllowed.into());
        }
        price_feed.price = lp_price;

        Ok(())
    }
}

impl<'info> UpdatePriceFeed<'info> {
    pub fn update_price_feed(&mut self,
    ) -> ProgramResult {
        let price_feed = &mut self.price_feed;
        price_feed.last_updated_time = self.clock.unix_timestamp as u64;

        let mut lp_price = 0;
        if price_feed.pair_count == 2 {
            lp_price = calc_stable_usdc_pair_lp_price(
                self.mint_coll.supply, 
                self.vault_a.amount, 
                price_feed.decimals_a, 
                self.vault_b.amount, 
                price_feed.decimals_b
            );
        }
        else if price_feed.pair_count == 3 {
            lp_price = calc_stable_usdc_3pair_lp_price(
                self.mint_coll.supply, 
                self.vault_a.amount, 
                price_feed.decimals_a, 
                self.vault_b.amount, 
                price_feed.decimals_b,
                self.vault_c.amount, 
                price_feed.decimals_c
            );
        }
        else {
            return Err(StablePoolError::NotAllowed.into());
        }
        price_feed.price = lp_price;

        Ok(())
    }
}


