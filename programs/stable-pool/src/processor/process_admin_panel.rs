use anchor_lang::prelude::*;

use crate::{
    instructions::*,
    constant::*,
    error::*,
    states::PlatformType
};

impl<'info> CreateGlobalState<'info> {
  pub fn create_state(&mut self, global_state_nonce:u8, mint_usd_nonce:u8, tvl_limit:u64, debt_ceiling:u64 ) -> ProgramResult {
      
      self.global_state.authority = self.super_owner.key();
      self.global_state.mint_usd = self.mint_usd.key();
      self.global_state.global_state_nonce = global_state_nonce;
      self.global_state.mint_usd_nonce = mint_usd_nonce;
      self.global_state.tvl_limit = tvl_limit;
      self.global_state.tvl = 0;
      self.global_state.total_debt = 0;
      self.global_state.debt_ceiling = debt_ceiling;
      self.global_state.fee_num = DEFAULT_FEE_NUMERATOR;
      self.global_state.fee_deno = DEFAULT_FEE_DENOMINATOR;
      self.global_state.coll_per_risklv = DEFAULT_RATIOS;
      Ok(())
  }
}

impl<'info> SetHarvestFee<'info> {
  pub fn set_fee(&mut self, fee_num: u64, fee_deno: u64) -> ProgramResult {
    self.global_state.fee_num = fee_num as u128;
    self.global_state.fee_deno = fee_deno as u128;
    Ok(())
  }
}

impl<'info> ToggleEmerState<'info> {
  pub fn toggle_state(&mut self, new_state: u8) -> ProgramResult {
    require!(self.global_state.paused != new_state, StablePoolError::NotAllowed);
    self.global_state.paused = new_state;
    Ok(())
  }
}

impl<'info> ChangeSuperOwner<'info> {
  pub fn change_owner(&mut self) -> ProgramResult {
    self.global_state.authority = self.new_owner.key();
    Ok(())
  }
}

impl<'info> SetGlobalTvlLimit<'info> {
  pub fn set_tvL_limit(&mut self, limit: u64) -> ProgramResult {
      self.global_state.tvl_limit = limit;
      Ok(())
  }
}

impl<'info> SetGlobalDebtCeiling<'info> {
  pub fn set(&mut self, ceiling: u64) -> ProgramResult {
      self.global_state.debt_ceiling = ceiling;
      Ok(())
  }
}

impl<'info> SetVaultDebtCeiling<'info> {
  pub fn set(&mut self, ceiling: u64) -> ProgramResult {
      self.token_vault.debt_ceiling = ceiling;
      Ok(())
  }
}

impl<'info> SetUserDebtCeiling<'info> {
  pub fn set(&mut self, ceiling: u64) -> ProgramResult {
      self.user_trove.debt_ceiling = ceiling;
      Ok(())
  }
}

impl<'info> CreateTokenVault<'info> {
  pub fn create_vault(&mut self, token_vault_nonce:u8, risk_level: u8, is_dual: u8, debt_ceiling: u64, platform_type: u8) -> ProgramResult {

      self.token_vault.mint_coll = self.mint_coll.key();
      msg!("Token Vault Nonce {}", token_vault_nonce);
      self.token_vault.total_coll = 0;
      self.token_vault.total_debt = 0;
      self.token_vault.risk_level = risk_level;
      self.token_vault.token_vault_nonce = token_vault_nonce;
      self.token_vault.is_dual = is_dual;
      self.token_vault.debt_ceiling = debt_ceiling;
      
      require!(platform_type >= 0 && platform_type < PlatformType::Unknown as u8, StablePoolError:: InvalidPlatformType);
      self.token_vault.platform_type = platform_type;
      
      Ok(())
  }
}

impl<'info> SetCollateralRatio<'info> {
  pub fn set_ratio(&mut self, ratios: &[u64]) -> ProgramResult {
    for item in ratios.iter().enumerate() {
      let (i, ratio_val) = item;
      self.global_state.coll_per_risklv[i] = *ratio_val;
    }
    Ok(())
  }
}



