use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Trove {
    pub bump: u8,
    pub user_usdx_bump: u8,
    pub ata_trove_bump: u8,
    pub ata_trove: Pubkey,
    pub reward_token_a: Pubkey,
    pub reward_token_b: Pubkey,
    pub debt: u64,
    pub debt_ceiling: u64,
    pub trove_reward_token_a_nonce: u8,
    pub trove_reward_token_b_nonce: u8,
    pub locked_coll_balance: u64,
    pub last_mint_time: u64,
    pub wallet_nonce: u8, // because of raydium
}
