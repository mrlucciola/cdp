// libraries
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    /// Bump/nonce for the global state pda
    pub bump: u8,
    pub authority: Pubkey,
    pub treasury: Pubkey,
    /// Mint address for USDx
    pub mint_usdx: Pubkey,
    /// Bump/nonce for the USDx mint address
    pub mint_usdx_bump: u8,
    /// TODO: rename to tvl_limit_usd
    /// aliases: tvlLimit
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
    /// TODO: rename to harvest_fee_numer
    pub fee_num: u64,
    /// The denomenator for calculating the fee
    pub fee_deno: u64,
    /// The collateral per risk
    pub coll_per_risklv: [u64; 10], // can we rename this

    /// only this wallet can report new prices to the oracle accounts
    pub oracle_reporter: Pubkey,
}
