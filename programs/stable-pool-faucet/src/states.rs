use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Faucet {
    pub super_owner: Pubkey,
    pub mint_lp: Pubkey,
}
