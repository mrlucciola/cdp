// libraries
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token};
// local
use crate::{constants::*, states::*};

pub fn handle(ctx: Context<CreateOracle>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;

    oracle.mint = ctx.accounts.mint.key();
    oracle.decimals = ctx.accounts.mint.decimals;
    oracle.last_updated_time = ctx.accounts.clock.unix_timestamp as u64;
    oracle.price = 0;
    oracle.bump = *ctx.bumps.get("oracle").unwrap();

    Ok(())
}

#[derive(Accounts)]
pub struct CreateOracle<'info> {
    /// The oracle reporter is the authority
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump = global_state.bump,
        constraint = authority.as_ref().key() == global_state.oracle_reporter,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    /// The oracle account for a single token - holds the USD price of a token
    #[account(
        init,
        payer = authority,
        seeds = [ORACLE_SEED.as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub oracle: Box<Account<'info, Oracle>>,
    // TODO 019: rename in client
    // TODO 020: rename in frontend
    /// The mint account for the collateral token
    pub mint: Box<Account<'info, Mint>>,

    // system accounts
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
