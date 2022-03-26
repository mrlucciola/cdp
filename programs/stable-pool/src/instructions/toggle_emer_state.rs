use anchor_lang::prelude::*;

// local
use crate::{constants::*, errors::*, states::global_state::GlobalState};

pub fn handle(ctx: Context<ToggleEmerState>, new_state: u8) -> Result<()> {
    require!(
        ctx.accounts.global_state.paused != new_state,
        StablePoolError::NotAllowed
    );
    ctx.accounts.global_state.paused = new_state;
    Ok(())
}

#[derive(Accounts)]
pub struct ToggleEmerState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,
}
