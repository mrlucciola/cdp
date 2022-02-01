use anchor_lang::prelude::*;

use crate::instructions::*;

pub fn process_create_token_vault(
    ctx: Context<CreateTokenVault>,
    token_vault_nonce: u8,
    risk_level: u8,
    is_dual: u8,
) -> ProgramResult {
    ctx.accounts.token_vault.mint_coll = ctx.accounts.mint_coll.key();
    ctx.accounts.token_vault.total_coll = 0;
    ctx.accounts.token_vault.total_debt = 0;
    ctx.accounts.token_vault.risk_level = risk_level;
    ctx.accounts.token_vault.token_vault_nonce = token_vault_nonce;
    ctx.accounts.token_vault.is_dual = is_dual;

    Ok(())
}
