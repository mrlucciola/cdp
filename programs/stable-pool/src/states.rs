use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub super_owner: Pubkey,
    pub mint_usd: Pubkey,
    pub global_state_nonce: u8,
    pub mint_usd_nonce: u8,
    pub tvl_limit: u64,
    pub tvl: u64,
}

#[account]
#[derive(Default)]
pub struct TokenVault {
    pub mint_coll: Pubkey,
    pub total_coll: u64,
    pub total_debt: u64,
    pub risk_level: u8,
    pub token_vault_nonce: u8,
    
}

#[account]
#[derive(Default)]
pub struct UserTrove {
    pub token_coll: Pubkey,
    pub reward_token_a: Pubkey,
    pub reward_token_b: Pubkey,
    pub locked_coll_balance: u64,
    pub debt: u64,
    pub last_mint_time: u64,
    pub user_trove_nonce: u8,
    pub token_coll_nonce: u8,
    pub user_usd_nonce: u8,
}
