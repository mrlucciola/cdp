use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Vault {
    /// vault bump
    pub bump: u8,
    /// authority/owner of this vault
    pub owner: Pubkey,
    /// the collateral mint acct that corresponds to this vault
    pub mint: Pubkey,
    pub ata_vault_bump: u8, // might not need this
    pub ata_vault: Pubkey,
    /// The amount of USDx borrowed off of the collateral in this vault
    pub debt: u64,
    /// the mint account for the reward
    pub reward_token_a: Pubkey,
    /// the mint account for the reward
    pub reward_token_b: Pubkey,
    pub vault_reward_token_a_nonce: u8, // can we get rid of this?
    pub vault_reward_token_b_nonce: u8, // can we get rid of this?
    pub locked_coll_balance: u64,
    pub last_mint_time: u64,
    pub wallet_nonce: u8, // because of raydium
}
