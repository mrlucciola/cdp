use anchor_lang::prelude::*;
use anchor_spl::token::{self,  Transfer};

use crate::{
    instructions::*,
    utils::*,
    constant::*,
};

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