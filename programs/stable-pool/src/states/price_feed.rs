// TODO: delete this file. its supposed to be named oracle
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct PriceFeed {// TODO: price-feed -> oracle
    pub mint: Pubkey,
    pub price: u64,
    pub decimals: u8,
    pub last_updated_time: u64,
}
