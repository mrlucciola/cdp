use anchor_lang::prelude::*;

use crate::{
    instructions::*,
};

pub fn process_set_vault_debt_ceiling(
    ctx: Context<SetVaultDebtCeiling>,
    ceiling:u64
) -> ProgramResult {
    ctx.accounts.token_vault.debt_ceiling = ceiling;
    Ok(())
}
