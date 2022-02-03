use anchor_lang::prelude::*;

use crate::instructions::*;

pub fn process_create_global_state(ctx: Context<CreateGlobalState>, global_state_nonce:u8, mint_usd_nonce:u8, tvl_limit:u64, debt_ceiling:u64) -> ProgramResult {
    
    ctx.accounts.global_state.super_owner = ctx.accounts.super_owner.key();
    ctx.accounts.global_state.mint_usd = ctx.accounts.mint_usd.key();
    ctx.accounts.global_state.global_state_nonce = global_state_nonce;
    ctx.accounts.global_state.mint_usd_nonce = mint_usd_nonce;
    ctx.accounts.global_state.tvl_limit = tvl_limit;
    ctx.accounts.global_state.tvl = 0;
    ctx.accounts.global_state.total_debt = 0;
    ctx.accounts.global_state.debt_ceiling = debt_ceiling;
    Ok(())
}
