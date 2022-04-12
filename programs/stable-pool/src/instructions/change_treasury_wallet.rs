use anchor_lang::prelude::*;

// local
use crate::{constants::*, states::global_state::GlobalState};

pub fn handle(ctx: Context<ChangeTreasuryWallet>, new_treasury: Pubkey) -> Result<()> {
    ctx.accounts.global_state.treasury = new_treasury;

    Ok(())
}

#[derive(Accounts)]
pub struct ChangeTreasuryWallet<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump = global_state.bump,
        has_one = authority,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
    /// CHECK: This is not dangerous because we don't ready or write from this account
    pub treasury: AccountInfo<'info>,
}
