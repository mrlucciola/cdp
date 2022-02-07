use anchor_lang::prelude::*;

use crate::{
    instructions::*,
    constant::*,
    error::*
};

pub fn process_create_global_state(ctx: Context<CreateGlobalState>, global_state_nonce:u8, mint_usd_nonce:u8, tvl_limit:u64, debt_ceiling:u64) -> ProgramResult {
    ctx.accounts.global_state.super_owner = ctx.accounts.super_owner.key();
    ctx.accounts.global_state.mint_usd = ctx.accounts.mint_usd.key();
    ctx.accounts.global_state.global_state_nonce = global_state_nonce;
    ctx.accounts.global_state.mint_usd_nonce = mint_usd_nonce;
    ctx.accounts.global_state.tvl_limit = tvl_limit;
    ctx.accounts.global_state.tvl = 0;
    ctx.accounts.global_state.total_debt = 0;
    ctx.accounts.global_state.debt_ceiling = debt_ceiling;
    ctx.accounts.global_state.fee_num = DEFAULT_FEE_NUMERATOR;
    ctx.accounts.global_state.fee_deno = DEFAULT_FEE_DENOMINATOR;
    Ok(())
}

pub fn process_create_token_vault(ctx: Context<CreateTokenVault>, token_vault_nonce:u8, risk_level: u8, is_dual: u8, debt_ceiling: u64) -> ProgramResult {
  ctx.accounts.token_vault.mint_coll = ctx.accounts.mint_coll.key();
  ctx.accounts.token_vault.total_coll = 0;
  ctx.accounts.token_vault.total_debt = 0;
  ctx.accounts.token_vault.risk_level = risk_level;
  ctx.accounts.token_vault.token_vault_nonce = token_vault_nonce;
  ctx.accounts.token_vault.is_dual = is_dual;
  ctx.accounts.token_vault.debt_ceiling = debt_ceiling;
  Ok(())
}

pub fn process_set_harvest_fee(ctx: Context<SetHarvestFee>, fee_num: u64, fee_deno: u64) -> ProgramResult {
  ctx.accounts.global_state.fee_num = fee_num as u128;
  ctx.accounts.global_state.fee_deno = fee_deno as u128;
  Ok(())
}

pub fn process_toggle_emer_state(ctx: Context<ToggleEmerState>, new_state: u8) -> ProgramResult {
  require!(ctx.accounts.global_state.paused != new_state, StablePoolError::NotAllowed);
  ctx.accounts.global_state.paused = new_state;
  Ok(())
}

pub fn process_change_super_owner(ctx: Context<ChangeSuperOwner>) -> ProgramResult {
  ctx.accounts.global_state.super_owner = ctx.accounts.new_owner.key();
  Ok(())
}

pub fn process_set_global_debt_ceiling(
  ctx: Context<SetGlobalDebtCeiling>,
  ceiling: u64
) -> ProgramResult {
  ctx.accounts.global_state.debt_ceiling = ceiling;
  Ok(())
}

pub fn process_set_vault_debt_ceiling(
  ctx: Context<SetVaultDebtCeiling>,
  ceiling: u64
) -> ProgramResult {
  ctx.accounts.token_vault.debt_ceiling = ceiling;
  Ok(())
}



