// TODO: remove this file. improperly named. migrated to 'report_price'
use anchor_lang::prelude::*;

use anchor_spl::token::Mint;
// local
use crate::{constants::*, errors::*, states::*};

// TODO: price-feed -> oracle
pub fn handle(ctx: Context<UpdatePriceFeed>, price: u64) -> Result<()> {
    require!(
        ctx.accounts.global_state.price_feed_updater == ctx.accounts.authority.key(),
        StablePoolError::NotAllowed
    );

    let price_feed = &mut ctx.accounts.price_feed;
    price_feed.price = price;
    price_feed.last_updated_time = ctx.accounts.clock.unix_timestamp as u64;
    Ok(())
}

#[derive(Accounts)]
#[instruction(price: u64)]
pub struct UpdatePriceFeed<'info> {// TODO: price-feed -> oracle
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
    #[account(
        mut,
        seeds = [PRICE_FEED_SEED,mint.key().as_ref()],
        bump,
    )]
    pub price_feed: Box<Account<'info, PriceFeed>>,// TODO: price-feed -> oracle
    pub mint: Box<Account<'info, Mint>>,
    pub clock: Sysvar<'info, Clock>,
}
