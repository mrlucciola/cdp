// libraries
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    /// Bump/nonce for the global state pda
    pub bump: u8,
    pub authority: Pubkey,
    /// Mint address for USDx
    pub mint_usdx: Pubkey,
    /// Bump/nonce for the USDx mint address
    pub mint_usdx_bump: u8,
    pub tvl_limit: u64,
    /// The total value locked on the CDP platform, in USD
    ///
    /// TODO: determine how to calculate tvl from each type of collateral
    pub tvl_usd: u64,
    /// Is contract paused
    pub paused: u8,
    /// The total amount of debt minted via the CDP platform, in USDx
    pub total_debt: u64,
    /// The limit on mintable debt, in USDx
    pub debt_ceiling: u64,
    /// The numerator for calculating the fee
    pub fee_num: u128,
    /// The denomenator for calculating the fee
    pub fee_deno: u128,
    /// The collateral per risk
    pub coll_per_risklv: [u64; 10],

    /// this wallet only can update price feed
    pub price_feed_updater: Pubkey,
}
