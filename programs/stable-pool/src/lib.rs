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


use crate::{
    states::*,
    error::*,
    constant::*,
    instructions::*,
    processor::*,
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");


#[program]
pub mod stable_pool {
    use super::*;

    pub fn lock_lp(ctx: Context<LockLp>) -> ProgramResult { process_lock_lp(&ctx) }

}