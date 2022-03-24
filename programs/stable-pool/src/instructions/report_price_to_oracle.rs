use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
// local
use crate::{constants::*, errors::*, states::*};

pub fn handle(ctx: Context<ReportPriceToOracle>, price: u64) -> Result<()> {
    require!(
        ctx.accounts.global_state.oracle_reporter == ctx.accounts.authority.key(),
        StablePoolError::NotAllowed
    );

    let oracle = &mut ctx.accounts.oracle;
    oracle.price = price;
    oracle.last_updated_time = ctx.accounts.clock.unix_timestamp as u64;

    Ok(())
}

#[derive(Accounts)]
#[instruction(price: u64)]
pub struct ReportPriceToOracle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(seeds = [GLOBAL_STATE_SEED], bump)]
    pub global_state: Box<Account<'info, GlobalState>>,
    #[account(
        mut,
        seeds = [ORACLE_SEED, mint.key().as_ref()],
        bump,
    )]
    pub oracle: Box<Account<'info, Oracle>>,
    pub mint: Box<Account<'info, Mint>>,
    pub clock: Sysvar<'info, Clock>,
}
