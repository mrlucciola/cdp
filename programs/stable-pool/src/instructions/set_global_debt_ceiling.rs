use anchor_lang::prelude::*;

// local
use crate::{constants::*, states::global_state::GlobalState};

pub fn handle(ctx: Context<SetGlobalDebtCeiling>, ceiling: u64) -> Result<()> {
    ctx.accounts.global_state.global_debt_ceiling = ceiling;

    Ok(())
}

#[derive(Accounts)]
pub struct SetGlobalDebtCeiling<'info> {
    #[account(
        mut,
        constraint = authority.as_ref().key().to_string() == "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi"
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump,
        has_one = authority,
    )]
    pub global_state: Account<'info, GlobalState>,
}
