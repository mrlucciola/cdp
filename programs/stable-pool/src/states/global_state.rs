// libraries
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    /// Bump/nonce for the global state pda
    pub bump: u8,
    pub authority: Pubkey,
    /// Public key for the treasury account
    pub treasury: Pubkey,
    /// Public key for the account that can report new prices to the oracle accounts
    pub oracle_reporter: Pubkey,
    /// Mint address for USDx
    pub mint_usdx: Pubkey,
    /// Bump/nonce for the USDx mint address
    pub mint_usdx_bump: u8,
    /// aliases: tvlCollatCeilingUsd;  prev: tvl_limit, tvl_limit_usd, tvlLimit
    pub tvl_collat_ceiling_usd: u64,
    /// The total value locked on the CDP platform, in USD
    ///
    /// TODO: determine how to calculate tvl from each type of collateral
    pub tvl_usd: u64,
    pub tvl_collat: [u64; 4],
    /// Is contract paused
    pub paused: u8,
    /// The total amount of debt minted via the CDP platform, in USDx
    pub total_debt_usdx: u64, // prev: total_debt
    /// The limit on the global mintable debt, in USDx
    pub debt_ceiling_global: u64,
    /// The limit on any pool's mintable debt, in USDx
    pub debt_ceiling_pool: u64,
    /// The limit on the mintable debt per user, in USDx
    pub debt_ceiling_user: u64,
    /// The numerator for calculating the fee
    /// TODO: rename to harvest_fee_numer
    pub fee_num: u64,
    /// The denomenator for calculating the fee
    pub fee_deno: u64,
    /// The collateral per risk
    pub coll_per_risklv: [u64; 10], // can we rename this

    /// reserved spaces for further update
    pub pubkeys: [Pubkey; 16],
    pub data_128: [u128; 8],
    pub data_64: [u64; 8],
    pub data_32: [u32; 8],
}
