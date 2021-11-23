use anchor_lang::prelude::*;

use crate::{
    instructions::*
};

pub fn process_create_state(ctx: Context<CreateFaucetState>, state_nonce:u8, mint_lp_nonce:u8) -> ProgramResult {
    ctx.accounts.faucet_state.super_owner = ctx.accounts.super_owner.key();
    ctx.accounts.faucet_state.mint_lp = ctx.accounts.mint_lp.key();
    Ok(())
}
