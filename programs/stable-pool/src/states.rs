use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub authority: Pubkey,
    pub mint_usd: Pubkey,
    pub global_state_nonce: u8,
    pub mint_usd_nonce: u8,
    pub tvl_limit: u64,
    pub tvl: u64,
    pub paused: u8,
    pub total_debt: u64,
    pub debt_ceiling: u64,
    pub fee_num: u128,
    pub fee_deno: u128,
    pub coll_per_risklv: [u64; 10],
}

#[account]
#[derive(Default)]
pub struct Vault {
    // prev: TokenVault
    pub mint_coll: Pubkey,
    pub reward_mint_a: Pubkey,
    pub reward_mint_b: Pubkey,
    pub is_dual: u8,
    pub total_coll: u64,
    pub total_debt: u64,
    pub debt_ceiling: u64,
    pub risk_level: u8,
    pub vault_bump: u8,

    pub platform_type: u8,
    pub farm_info: Pubkey,
}

#[account]
#[derive(Default)]
pub struct SaberFarmAccount {
    pub quarry: Pubkey,
    pub rewarder: Pubkey,
    pub mint_wrapper: Pubkey,
    pub minter: Pubkey,
    pub claim_fee_token_account: Pubkey,
}

#[account]
#[derive(Default)]
pub struct Trove {
    pub wallet_nonce: u8, // because of raydium
    pub reward_token_a: Pubkey,
    pub reward_token_b: Pubkey,
    pub locked_coll_balance: u64,
    pub debt: u64,
    pub debt_ceiling: u64,
    pub trove_nonce: u8,
    pub ata_trove_nonce: u8,
    pub token_coll: Pubkey,
    pub user_usd_nonce: u8,
    pub last_mint_time: u64,
    pub trove_reward_token_a_nonce: u8,
    pub trove_reward_token_b_nonce: u8,
}

// Risk Level
pub enum RiskLevel {
    AAA,
    AA,
    A,
    BBB,
    BB,
    B,
    CCC,
    CC,
    C,
    D,
}

pub enum PlatformType {
    Saber,
    // Raydium,
    // Orca,
    // Mercurial,
    Unknown,
}

#[account]
#[derive(Default)]
pub struct PriceFeed {
    pub mint_coll: Pubkey,
    pub mint_a: Pubkey, // usdc
    pub mint_b: Pubkey,
    pub mint_c: Pubkey,
    pub vault_a: Pubkey, // usdc
    pub vault_b: Pubkey,
    pub vault_c: Pubkey,
    pub decimals_a: u8, // usdc
    pub decimals_b: u8,
    pub decimals_c: u8,
    pub pair_count: u8,
    pub price: u64,
    pub last_updated_time: u64,
}
