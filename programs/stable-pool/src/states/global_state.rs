// libraries
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub bump: u8,
    pub authority: Pubkey,
    pub mint_usdx: Pubkey,
    pub mint_usdx_bump: u8,
    pub tvl_limit: u64,
    pub tvl: u64,
    pub paused: u8,
    pub total_debt: u64,
    pub debt_ceiling: u64,
    pub fee_num: u128,
    pub fee_deno: u128,
    pub coll_per_risklv: [u64; 10],
}
