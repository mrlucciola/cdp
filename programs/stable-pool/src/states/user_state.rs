use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserState {
    /// user state bump
    pub bump: u8,
    /// authority/owner of this vault
    pub owner: Pubkey,
    /// The amount of USDx borrowed off of the collateral by this user
    pub debt: u64,
    /// the amount of token deposited in all of a user's vaults, in
    pub deposited_collat_usd: u64,

    /// reserved spaces for further update
    pub pubkeys: [Pubkey; 16],
    pub data_128: [u128; 8],
    pub data_64: [u64; 8],
    pub data_32: [u32; 8],
}
