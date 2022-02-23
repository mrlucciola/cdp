use anchor_lang::prelude::*;

#[account] // #[account(zero_copy)] //
#[derive(Default)]
pub struct Vault {
    pub bump: u8,
    pub mint_coll: Pubkey,
    pub reward_mint_a: Pubkey,
    pub reward_mint_b: Pubkey,
    pub is_dual: u8,
    pub total_coll: u64,
    pub total_debt: u64,
    pub debt_ceiling: u64,
    pub risk_level: u8,

    pub platform_type: u8,
    pub farm_info: Pubkey,
}
