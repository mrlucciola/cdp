use anchor_lang::prelude::*;

// TODO: add loan to value - LTV
/// This is a pool for a 2-token LP collateral type
#[account] // #[account(zero_copy)] //
#[derive(Default)]
pub struct Pool {
    /// the nonce/bump seed for the pool
    pub bump: u8,
    /// the mint account for the collateral token that represents this pool
    pub mint_collat: Pubkey,
    /// TODO: turn this into an array
    pub mint_reward: Pubkey,

    // tokens that comprise the collateral token
    /// token a decimal precision
    pub token_a_decimals: u8,
    /// token b decimal precision
    pub token_b_decimals: u8,
    /// total USD value locked across CDP platform for this pool's collateral class
    pub tvl_usd: u64,
    pub total_coll: u64,
    /// total amount of debt
    pub total_debt: u64, // TODO: total_debt -> total_debt_usd
    /// max amount of debt able to be taken on this collateral class
    pub debt_ceiling: u64, // TODO: debt_ceiling -> debt_ceiling_usd
    pub risk_level: u8, // what type of number is this supposed to represent
    /// represents an enum
    pub platform_type: u8,
    /// this is not implemented correctly.
    /// TODO: allow for multiple farms - turn to array
    pub farm_info: Pubkey,

    // for price feeds. token a and b make up collateral lp in this pool.
    pub mint_token_a: Pubkey,
    pub mint_token_b: Pubkey,

    /// extra space
    pub pubkeys: [Pubkey; 16],
    pub data_128: [u128; 4],
    pub data_64: [u64; 4],
    pub data_32: [u32; 4],
}
