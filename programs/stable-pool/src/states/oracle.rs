use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Oracle {
    pub mint: Pubkey,
    pub price: u64,
    pub decimals: u8,
    pub last_updated_time: u64,
}
