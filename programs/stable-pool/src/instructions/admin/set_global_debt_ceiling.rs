use anchor_lang::prelude::*;

// local
use crate::{constants::*, states::global_state::GlobalState};

pub fn handle(ctx: Context<SetGlobalDebtCeiling>, ceiling: u64) -> Result<()> {
    ctx.accounts.global_state.debt_ceiling_global = ceiling;

    Ok(())
}

#[derive(Accounts)]
pub struct SetGlobalDebtCeiling<'info> {
    #[account(constraint = authority.as_ref().key().to_string() == global_state.authority.to_string().as_ref())]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump,
        has_one = authority,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
}
