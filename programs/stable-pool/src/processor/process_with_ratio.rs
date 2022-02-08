use anchor_lang::prelude::*;
use anchor_spl::token::{self,  Transfer, MintTo, Burn};

use crate::{
    instructions::*,
    utils::*,
    constant::*,
    error::*,
};

impl<'info> CreateUserTrove<'info> {
    /// Claims rewards from saber farm
    pub fn create(&mut self, 
        user_trove_nonce: u8,
        token_coll_nonce: u8, 
    ) -> ProgramResult {
        self.user_trove.locked_coll_balance = 0;
        self.user_trove.debt = 0;
        self.user_trove.user_trove_nonce = user_trove_nonce;
        self.user_trove.token_coll_nonce = token_coll_nonce;

        Ok(())
    }
}

impl<'info> CreateUserRewardVault<'info> {
    /// Claims rewards from saber farm
    pub fn create(&mut self
    ) -> ProgramResult {

        self.token_vault.reward_mint_a = self.reward_mint.key();
        Ok(())
    }
}

impl<'info> RatioStaker<'info> {
    /// Claims rewards from saber farm
    pub fn deposit(&mut self, amount: u64, ) -> ProgramResult {

    
        assert_tvl_allowed(self.global_state.tvl_limit, self.global_state.tvl, amount)?;
        
        // transfer from user to pool
        let cpi_accounts = Transfer {
            from: self.user_token_coll.to_account_info().clone(),
            to: self.pool_token_coll.to_account_info().clone(),
            authority: self.owner.to_account_info().clone(),
        };

        let cpi_program = self.token_program.to_account_info().clone();
        
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, amount)?;

        self.token_vault.total_coll += amount;
        self.user_trove.locked_coll_balance += amount;
        self.global_state.tvl += amount;

        Ok(())
    }
    pub fn withdraw(&mut self, amount: u64, ) -> ProgramResult {
        msg!("withdrawing ...");
    
        let mut _amount = amount;
        if amount > self.user_trove.locked_coll_balance {
            _amount = self.user_trove.locked_coll_balance;
        }
        
        // transfer from pool to user
        let cpi_accounts = Transfer {
            from: self.pool_token_coll.to_account_info(),
            to: self.user_token_coll.to_account_info(),
            authority: self.user_trove.to_account_info(),
        };
    
        let cpi_program = self.token_program.to_account_info();
    
        let signer_seeds = &[
            USER_TROVE_TAG,
            self.token_vault.to_account_info().key.as_ref(), 
            self.owner.to_account_info().key.as_ref(),
            &[self.user_trove.user_trove_nonce],
        ];
        let signer = &[&signer_seeds[..]];
    
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        msg!("transfering ...");
        token::transfer(cpi_ctx, _amount)?;
    
        msg!("updating ...");
        self.token_vault.total_coll -= amount;
        self.user_trove.locked_coll_balance -= _amount;
        self.global_state.tvl -= amount;
    
        Ok(())
    }
}

impl<'info> HarvestReward<'info> {
    pub fn harvest(&mut self) -> ProgramResult {
        
        self.user_trove_reward.reload()?;
        let fee_info = calculate_fee(self.user_trove_reward.amount, self.global_state.fee_num, self.global_state.fee_deno)?;
        
        require!(fee_info.new_amount > 0, StablePoolError::InvalidTransferAmount);
        require!(fee_info.owner_fee > 0, StablePoolError::InvalidTransferAmount);

        let user_trove = &mut self.user_trove;
        let trove_key = user_trove.key();
        
        let authority_seeds = &[USER_TROVE_POOL_TAG.as_ref(), trove_key.as_ref(), &[user_trove.token_coll_nonce]];

        token::transfer(CpiContext::new(
            self.token_program.to_account_info(), 
            Transfer {
                from: self.user_trove_reward.to_account_info(),
                to: self.user_reward_token.to_account_info(),
                authority: self.user_trove.to_account_info(),
            }).with_signer(&[&authority_seeds[..]]), 
            fee_info.new_amount
        )?;

        token::transfer(CpiContext::new(
            self.token_program.to_account_info(), 
            Transfer {
                from: self.user_trove_reward.to_account_info(),
                to: self.reward_fee_token.to_account_info(),
                authority: self.user_trove.to_account_info(),
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

        assert_debt_allowed(self.user_trove.locked_coll_balance, self.user_trove.debt, amount, self.token_vault.risk_level)?;
        assert_vault_debt_ceiling_not_exceeded(self.token_vault.debt_ceiling, self.token_vault.total_debt, amount)?;
        assert_global_debt_ceiling_not_exceeded(self.global_state.debt_ceiling, self.global_state.total_debt, amount)?;
        
        let cur_timestamp = self.clock.unix_timestamp as u64;

        assert_limit_mint(cur_timestamp, self.user_trove.last_mint_time)?;
        // mint to user
        let cpi_accounts = MintTo {
            mint: self.mint_usd.to_account_info().clone(),
            to: self.user_token_usd.to_account_info().clone(),
            authority: self.global_state.to_account_info().clone(),
        };

        let cpi_program = self.token_program.to_account_info().clone();

        let signer_seeds = &[
            GLOBAL_STATE_TAG,
            &[self.global_state.global_state_nonce],
        ];
        let signer = &[&signer_seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::mint_to(cpi_ctx, amount)?;

        self.token_vault.total_debt += amount;
        self.global_state.total_debt += amount;
        self.user_trove.debt += amount;
        self.user_trove.last_mint_time = cur_timestamp;
        self.user_trove.user_usd_nonce = user_usd_token_nonce;

        Ok(())
    }
}


impl<'info> RepayUsd<'info> {
    pub fn repay(&mut self,
        amount: u64,
    ) -> ProgramResult {
        let mut _amount = amount;
        if self.user_trove.debt < amount {
            _amount = self.user_trove.debt;
        }
        // burn
        let cpi_accounts = Burn {
            mint: self.mint_usd.to_account_info().clone(),
            to: self.user_token_usd.to_account_info().clone(),
            authority: self.owner.to_account_info().clone(),
        };

        let cpi_program = self.token_program.to_account_info().clone();

        let signer_seeds = &[
            GLOBAL_STATE_TAG,
            &[self.global_state.global_state_nonce],
        ];
        let signer = &[&signer_seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::burn(cpi_ctx, _amount)?;

        self.token_vault.total_debt -= _amount;
        self.global_state.total_debt -= _amount;
        self.user_trove.debt -= _amount;

        Ok(())
    }
}


