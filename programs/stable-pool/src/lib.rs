use anchor_lang::prelude::*;

/// constant
pub mod constant;
/// error
pub mod error;
/// instructions
pub mod instructions;
///processor
pub mod processor;
/// pyth
pub mod pyth;
/// raydium
pub mod raydium;
/// states
pub mod states;
/// utils
pub mod utils;
use crate::{instructions::*, processor::*};

declare_id!("cW8hHb9Azuk99GihhsuFHvAmqSivfjzAFyZ1LjiXsAp");

#[program]
pub mod stable_pool {
    use super::*;

    pub fn create_global_state(ctx: Context<CreateGlobalState>, global_state_nonce:u8, mint_usd_nonce:u8, tvl_limit:u64, debt_ceiling:u64) -> ProgramResult { 
        process_create_global_state(ctx, global_state_nonce, mint_usd_nonce, tvl_limit, debt_ceiling) 
    }
    pub fn create_token_vault(ctx: Context<CreateTokenVault>, token_vault_nonce:u8, risk_level:u8, is_dual:u8, debt_ceiling:u64) -> ProgramResult { 
        process_create_token_vault(ctx, token_vault_nonce, risk_level, is_dual, debt_ceiling)
    }
    pub fn create_user_trove(
        ctx: Context<CreateUserTrove>,
        user_trove_nonce: u8,
        token_coll_nonce: u8,
    ) -> ProgramResult {
        process_create_user_trove(ctx, user_trove_nonce, token_coll_nonce)
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> ProgramResult {
        process_deposit_collateral(ctx, amount)
    }
    pub fn withdraw_collateral(ctx: Context<WithdrawCollateral>, amount: u64) -> ProgramResult {
        process_withdraw_collateral(ctx, amount)
    }

    pub fn borrow_usd(
        ctx: Context<BorrowUsd>,
        amount: u64,
        user_usd_token_nonce: u8,
    ) -> ProgramResult {
        process_borrow_usd(ctx, amount, user_usd_token_nonce)
    }
    pub fn repay_usd(ctx: Context<RepayUsd>, amount: u64) -> ProgramResult {
        process_repay_usd(ctx, amount)
    }
    pub fn create_raydium_v5_reward_vaults(
        ctx: Context<CreateRaydiumV5RewardVaults>,
        user_trove_reward_token_a_nonce: u8,
        user_trove_reward_token_b_nonce: u8,
    ) -> ProgramResult {
        process_create_raydium_v5_reward_vaults(
            ctx,
            user_trove_reward_token_a_nonce,
            user_trove_reward_token_b_nonce,
        )
    }
    pub fn deposit_raydium_v5_collateral(
        ctx: Context<DepositRaydiumV5Collateral>,
        amount: u64,
    ) -> ProgramResult {
        process_deposit_raydium_v5_collateral(ctx, amount)
    }
    pub fn withdraw_raydium_v5_collateral(
        ctx: Context<WithdrawRaydiumV5Collateral>,
        amount: u64,
    ) -> ProgramResult {
        process_withdraw_raydium_v5_collateral(ctx, amount)
    }
    pub fn create_raydium_user_account(
        ctx: Context<CreateRaydiumUserAccount>,
        user_trove_nonce: u8,
    ) -> ProgramResult {
        process_create_raydium_user_account(ctx, user_trove_nonce)
    }

    // orca integration
    pub fn create_orca_vault(
        ctx: Context<CreateOrcaVault>,
        is_dd: u8,
        orca_vault_nonce: u8,
    ) -> ProgramResult {
        process_create_orca_vault(ctx, is_dd, orca_vault_nonce)
    }

    pub fn init_orca_farm(
        ctx: Context<InitRatioUserFarm>,
        ratio_authority_bump: u8,
    ) -> ProgramResult {
        process_init_orca_farm(ctx, ratio_authority_bump)
    }

    pub fn deposit_orca_lp(
        ctx: Context<DepositOrcaLP>,
        amount: u64,
        ratio_authority_bump: u8,
    ) -> ProgramResult {
        process_deposit_orcalp(ctx, amount, ratio_authority_bump)
    }

    pub fn withdraw_orca_lp(
        ctx: Context<WithdrawOrcaLP>,
        amount: u64,
        ratio_authority_bump: u8,
    ) -> ProgramResult {
        process_withdraw_orcalp(ctx, amount, ratio_authority_bump)
    }

    pub fn harvest_reward(ctx: Context<HarvestReward>, ratio_authority_bump: u8) -> ProgramResult {
        process_harvest_reward(ctx, ratio_authority_bump)
    }

    pub fn set_global_debt_ceiling(ctx: Context<SetGlobalDebtCeiling>, ceiling: u64) -> ProgramResult {
        process_set_global_debt_ceiling(ctx, ceiling)
    }
    pub fn set_vault_debt_ceiling(ctx: Context<SetVaultDebtCeiling>, ceiling: u64) -> ProgramResult {
        process_set_vault_debt_ceiling(ctx, ceiling)
    }
}
