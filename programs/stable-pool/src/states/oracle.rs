// libraries
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Oracle {
    /// The oracle account's bump seed
    pub bump: u8,
    /// The authority account for this oracle
    pub authority: Pubkey,
    /// The collateral mint for this oracle
    pub mint_collat: Pubkey,
    /// The current price of a given token, reported by report_price_to_oracle
    pub price: u64,
    /// The number of decimals, the precision for the price value
    pub decimals: u8,
    /// The last time that
    pub last_updated_time: u64,

    /// reserved spaces for further update
    pub pubkeys: [Pubkey; 8],
    pub data: [u128; 8],
}
