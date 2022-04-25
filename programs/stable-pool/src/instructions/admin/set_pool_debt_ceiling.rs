use anchor_lang::prelude::*;

// local
use crate::{constants::*, states::global_state::GlobalState, states::pool::Pool};

pub fn handle(ctx: Context<SetPoolDebtCeiling>, ceiling: u64) -> Result<()> {
    ctx.accounts.pool.debt_ceiling = ceiling;

    Ok(())
}

#[derive(Accounts)]
pub struct SetPoolDebtCeiling<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump,
        has_one = authority,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds=[POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump=pool.bump,
    )]
    pub pool: Box<Account<'info, Pool>>,
}
