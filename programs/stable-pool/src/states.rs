use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    owner: Pubkey,
}

#[account]
#[derive(Default)]
pub struct TokenVault {
    owner: Pubkey,
    token_a: Pubkey,
    token_b: Pubkey,
    token_lp: Pubkey,
}

#[account]
#[derive(Default)]
pub struct UserTrove {
    owner: Pubkey,
    vault: Pubkey,
    token_a_balance: u64,
    token_b_balance: u64,
    token_lp_balance: u64,
    debt_lp: u64
}
