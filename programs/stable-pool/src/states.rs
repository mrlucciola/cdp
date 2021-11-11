use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    owner: Pubkey,
}

