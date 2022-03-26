use anchor_lang::prelude::*;

// TODO: rename trove -> vault
#[account]
#[derive(Default)]
pub struct Trove {
    /// trove bump
    pub bump: u8,
    /// the mint acct that corresponds to this trove
    pub mint: Pubkey,
    pub ata_usdx_bump: u8, // do we still need this?
    pub ata_trove_bump: u8, // TODO: rename trove -> vault
    pub ata_trove: Pubkey,  // TODO: rename trove -> vault
    /// The amount of USDx borrowed off of the collateral in this trove
    pub debt: u64,
    /// the mint account for the reward
    pub reward_token_a: Pubkey,
    /// the mint account for the reward
    pub reward_token_b: Pubkey,
    pub trove_reward_token_a_nonce: u8, // TODO: rename trove -> vault // can we get rid of this?
    pub trove_reward_token_b_nonce: u8, // TODO: rename trove -> vault // can we get rid of this?
    pub locked_coll_balance: u64,
    pub last_mint_time: u64,
    pub wallet_nonce: u8, // because of raydium
}
