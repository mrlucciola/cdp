use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Vault {
    /// vault bump
    pub bump: u8,
    /// authority/owner of this vault
    pub owner: Pubkey,
    /// The associated pool's pubkey
    pub pool: Pubkey,
    /// the collateral mint acct that corresponds to this vault
    pub mint: Pubkey,
    // TODO 010: mint_reward -> get from pool
    /// the mint account for the reward
    pub mint_reward: Pubkey,
    /// The vault's A.T.A. for collat token, mint acct pubkey stored at pool acct
    pub ata_collat_vault: Pubkey,
    /// The bump for ata-collat-vault
    pub ata_collat_vault_bump: u8, // might not need this
    /// The miner's A.T.A. for collat token, mint acct pubkey stored at pool acct
    pub ata_collat_miner: Pubkey,
    /// The amount of USDx borrowed off of the collateral in this vault
    pub debt: u64,
    // TODO 016: Remove. There is only one reward token for quarry vaults, and we dont hold reward token in vaults
    pub vault_reward_token_a_nonce: u8, // can we get rid of this?
    // TODO 016: Remove. There is only one reward token for quarry vaults, and we dont hold reward token in vaults
    pub vault_reward_token_b_nonce: u8, // can we get rid of this?
    // pub locked_coll_balance: u64,
    pub deposited_collat_usd: u64,
    /// The last recorded time USDx was minted through this vault
    pub last_mint_time: u64,
    /// Unknown what this is for
    pub wallet_nonce: u8, // because of raydium
    /// reserved spaces for further update
    pub pubkeys: [Pubkey; 16],
    pub data_128: [u128; 8],
    pub data_64: [u64; 8],
    pub data_32: [u32; 8],
}
