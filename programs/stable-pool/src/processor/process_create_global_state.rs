use anchor_lang::prelude::*;

use crate::{
    instructions::*
};

pub fn process_create_global_state(
    ctx: Context<CreateGlobalState>, 
    global_state_nonce:u8, 
    mint_usd_nonce:u8,
    tvl_limit:u64
) -> ProgramResult {
    
    ctx.accounts.global_state.super_owner = ctx.accounts.super_owner.key();
    ctx.accounts.global_state.mint_usd = ctx.accounts.mint_usd.key();
    ctx.accounts.global_state.tvl_limit = tvl_limit;
    ctx.accounts.global_state.tvl = 0;
    Ok(())
}
