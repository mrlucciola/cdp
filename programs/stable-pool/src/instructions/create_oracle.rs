// libraries
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token};
// local
use crate::{constants::*, states::*};

pub fn handle(ctx: Context<CreateOracle>, price: u64) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;

    oracle.mint = ctx.accounts.mint.key();
    oracle.decimals = ctx.accounts.mint.decimals;
    oracle.last_updated_time = ctx.accounts.clock.unix_timestamp as u64;
    oracle.price = price;

    Ok(())
}

#[derive(Accounts)]
#[instruction(price: u64)]
pub struct CreateOracle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump,
        has_one = authority)]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        init,
        seeds = [ORACLE_SEED, mint.key().as_ref()],
        bump,
        payer = authority
    )]
    pub oracle: Box<Account<'info, Oracle>>,

    pub mint: Box<Account<'info, Mint>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
