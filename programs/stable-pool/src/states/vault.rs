use anchor_lang::prelude::*;

// TODO: add loan to value - LTV
// TODO: rename vault -> pool
/// This is a pool for a 2-token LP collateral type
#[account] // #[account(zero_copy)] //
#[derive(Default)]
pub struct Vault {
    /// the nonce/bump seed for the vault
    pub bump: u8,
    /// the mint account for the collateral token that represents this vault
    pub mint_collat: Pubkey,
    pub reward_mint_a: Pubkey, // is this supposed to be the reward mint?
    pub reward_mint_b: Pubkey, // is this supposed to be the reward mint?
    // tokens that comprise the collateral token
    /// token a decimal precision
    pub token_a_decimals: u8,
    /// token b decimal precision
    pub token_b_decimals: u8,
    /// TODO: remove. vault classes will be by their type and possibly even platform
    pub is_dual: u8,
    /// total USD value locked across CDP platform for this vault's collateral class
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
    /// TODO: allow for multiple farms
    pub farm_info: Pubkey,

    // for price feeds. token a and b make up collateral lp in this vault.
    pub mint_token_a: Pubkey,
    pub mint_token_b: Pubkey
}
