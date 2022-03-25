use anchor_lang::prelude::*;

// TODO: rename vault -> pool
/// This is a pool for a 2-token LP collateral type
#[account] // #[account(zero_copy)] //
#[derive(Default)]
pub struct Vault {
    pub bump: u8,
    pub mint: Pubkey,
    pub reward_mint_a: Pubkey,
    pub reward_mint_b: Pubkey,

    // This is not implemented yet. Keep an array of public keys for all the collateral types.
    //     - For a future refactor
    // pub tokens: [Pubkey; 5],
    // tokens that comprise the collateral token
    pub token_a_decimals: u8,
    pub token_b_decimals: u8,
    pub is_dual: u8,
    pub tvl_usd: u64,
    pub total_coll: u64,
    pub total_debt: u64,
    pub debt_ceiling: u64,
    pub risk_level: u8,

    pub platform_type: u8,
    pub farm_info: Pubkey,
}
