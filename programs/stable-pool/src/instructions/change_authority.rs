use anchor_lang::prelude::*;

// local
use crate::{constants::*, states::global_state::GlobalState};

pub fn handle(ctx: Context<ChangeAuthority>, new_authority: Pubkey) -> Result<()> {
    ctx.accounts.global_state.authority = new_authority;

    Ok(())
}

#[derive(Accounts)]
pub struct ChangeAuthority<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump = global_state.bump,
        has_one = authority
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
}
