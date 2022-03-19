use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Token, Mint};

// local
use crate::{
    constants::*,
    states::*,
    utils::*
};

pub fn handle(
    ctx: Context<CreatePriceFeed>,
    price: u64, 
) -> Result<()> {
    let price_feed = &mut ctx.accounts.price_feed;
    
    price_feed.mint = ctx.accounts.mint.key();
    price_feed.decimals = ctx.accounts.mint.decimals;
    price_feed.last_updated_time = ctx.accounts.clock.unix_timestamp as u64;
    price_feed.price = price;

    Ok(())
}

#[derive(Accounts)]
#[instruction(price: u64)]
pub struct CreatePriceFeed<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump,
        has_one = authority)]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        init,
        seeds = [PRICE_FEED_SEED, mint.key().as_ref()],
        bump,
        payer = authority
    )]
    pub price_feed: Box<Account<'info, PriceFeed>>,

    pub mint: Box<Account<'info, Mint>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
