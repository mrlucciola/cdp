use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, MintTo, ID};

use crate::{
    states::*,
    error::*,
    constant::*,
    instructions::*
};

pub fn process_mint_usdx(ctx: Context<MintUSDx>, amount: u64) -> ProgramResult {
    
    // transfer from user to pool
    let cpi_accounts = MintTo {
        mint: ctx.accounts.usdx_mint.to_account_info().clone(),
        to: ctx.accounts.user_usdx_token.to_account_info().clone(),
        authority: ctx.accounts.pool_authority.clone(),
    };

    let cpi_program = ctx.accounts.token_program.clone();
    
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::mint_to(cpi_ctx, amount)?;

    ctx.accounts.user_trove.locked_coll_balance += amount;

    Ok(())
}
