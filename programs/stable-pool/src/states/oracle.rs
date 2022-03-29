use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Oracle {
    // TODO: add auth to verify updaters
    pub mint: Pubkey,
    pub price: u64,
    pub decimals: u8,
    pub last_updated_time: u64,
    
    /// reserved spaces for further update
    pub pubkeys: [Pubkey; 8],
    pub data: [u128; 8],
}
