use anchor_lang::prelude::*;

/// states
pub mod states;
///processor
pub mod processor;
/// error
pub mod error;
/// constant
pub mod constant;
/// instructions
pub mod instructions;
/// utils
pub mod utils;

use crate::{
    instructions::*,
    processor::*,
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod stable_pool_faucet {
    use super::*;

    pub fn create_state(ctx: Context<CreateFaucetState>, state_nonce:u8, mint_lp_nonce:u8) -> ProgramResult { process_create_state(ctx, state_nonce, mint_lp_nonce) }
    pub fn faucet_lp(ctx: Context<FaucetLp>, amount: u64,state_nonce: u8, mint_lp_nonce: u8) -> ProgramResult { process_faucet_lp(ctx, amount,state_nonce, mint_lp_nonce) }
}