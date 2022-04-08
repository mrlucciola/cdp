// libraries
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token};
// local
use crate::{constants::*, states::*};

pub fn handle(ctx: Context<CreateOracle>, price: u64) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;

    oracle.mint_collat = ctx.accounts.mint_collat.key();
    oracle.decimals = ctx.accounts.mint_collat.decimals;
    oracle.last_updated_time = ctx.accounts.clock.unix_timestamp as u64;
    oracle.price = price;
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
        bump, // TODO 004: precompute bump
        constraint = authority.as_ref().key() == global_state.oracle_reporter,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    /// The oracle account for a single token - holds the USD price of a token
    #[account(
        init,
        payer = authority,
        seeds = [ORACLE_SEED.as_ref(), mint_collat.key().as_ref()],
        bump,
    )]
    pub oracle: Box<Account<'info, Oracle>>,
    /// The mint account for the collateral token
    pub mint_collat: Box<Account<'info, Mint>>,

    // system accounts
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
