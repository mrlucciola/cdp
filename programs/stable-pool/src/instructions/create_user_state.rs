// libraries
use anchor_lang::prelude::*;
// local
use crate::{constants::*, states::UserState};

pub fn handle(ctx: Context<CreateUserState>) -> Result<()> {
    ctx.accounts.user_state.tvl_collat_usd = 0;
    ctx.accounts.user_state.total_debt_usdx = 0;
    ctx.accounts.user_state.owner = ctx.accounts.authority.as_ref().key();
    ctx.accounts.user_state.bump = *ctx.bumps.get("user_state").unwrap();

    Ok(())
}

#[derive(Accounts)]
pub struct CreateUserState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        seeds = [USER_STATE_SEED.as_ref(), authority.key().as_ref()],
        bump,
    )]
    pub user_state: Box<Account<'info, UserState>>,

    // system accts
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
