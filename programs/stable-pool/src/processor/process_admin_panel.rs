use anchor_lang::prelude::*;

use crate::{
    instructions::*,
    constant::*,
    error::*
};

impl<'info> CreateGlobalState<'info> {
  /// Claims rewards from saber farm
  pub fn create(&mut self, global_state_nonce:u8, mint_usd_nonce:u8, tvl_limit:u64, debt_ceiling:u64 ) -> ProgramResult {
      
      self.global_state.authority = self.super_owner.key();
      self.global_state.mint_usd = self.mint_usd.key();
      self.global_state.global_state_nonce = global_state_nonce;
      self.global_state.mint_usd_nonce = mint_usd_nonce;
      self.global_state.tvl_limit = tvl_limit;
      self.global_state.tvl = 0;
      self.global_state.total_debt = 0;
      self.global_state.debt_ceiling = debt_ceiling;
      
      Ok(())
  }
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
  ctx.accounts.global_state.authority = ctx.accounts.new_owner.key();
  Ok(())
}


impl<'info> SetGlobalDebtCeiling<'info> {
  /// Claims rewards from saber farm
  pub fn set(&mut self, ceiling:u64 ) -> ProgramResult {
      self.global_state.debt_ceiling = ceiling;
      Ok(())
  }
}

impl<'info> SetVaultDebtCeiling<'info> {
  /// Claims rewards from saber farm
  pub fn set(&mut self, ceiling:u64 ) -> ProgramResult {
      self.token_vault.debt_ceiling = ceiling;
      Ok(())
  }
}

impl<'info> CreateTokenVault<'info> {
  /// Claims rewards from saber farm
  pub fn create(&mut self, token_vault_nonce:u8, risk_level: u8, is_dual: u8, debt_ceiling: u64) -> ProgramResult {

      self.token_vault.mint_coll = self.mint_coll.key();
      msg!("Token Vault Nonce {}", token_vault_nonce);
      self.token_vault.total_coll = 0;
      self.token_vault.total_debt = 0;
      self.token_vault.risk_level = risk_level;
      self.token_vault.token_vault_nonce = token_vault_nonce;
      self.token_vault.is_dual = is_dual;
      self.token_vault.debt_ceiling = debt_ceiling;
      Ok(())
  }
}


