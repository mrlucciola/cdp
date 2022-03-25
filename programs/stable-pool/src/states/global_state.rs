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
    /// The limit on the global mintable debt, in USDx
    pub global_debt_ceiling: u64,
    /// The limit on the mintable debt per user, in USDx
    pub user_debt_ceiling: u64,
    /// The numerator for calculating the fee
    pub fee_num: u32,
    /// The denomenator for calculating the fee
    pub fee_deno: u32,
    /// The collateral per risk
    pub coll_per_risklv: [u64; 10],

    /// only this wallet can report new prices to the oracle accounts
    pub oracle_reporter: Pubkey,
}
