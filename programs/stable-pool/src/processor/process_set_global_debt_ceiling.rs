use anchor_lang::prelude::*;

use crate::{
    instructions::*,
};

pub fn process_set_global_debt_ceiling(
    ctx: Context<SetGlobalDebtCeiling>,
    ceiling:u64
) -> ProgramResult {
    ctx.accounts.global_state.debt_ceiling = ceiling;
    Ok(())
}
