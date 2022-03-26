// libraries
use anchor_lang::prelude::*;
// local
use crate::{constants::*, states::GlobalState};

pub fn handle(ctx: Context<SetHarvestFee>, fee_num: u64) -> Result<()> {
    ctx.accounts.global_state.fee_num = fee_num;

    Ok(())
}

#[derive(Accounts)]
pub struct SetHarvestFee<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,
}
