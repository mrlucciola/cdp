use anchor_lang::prelude::*;

/// constant
pub mod constant;
/// error
pub mod error;
/// instructions
pub mod instructions;
///processor
pub mod processor;
/// states
pub mod states;
/// utils
pub mod utils;
use crate::{instructions::*, processor::*, utils::*};

declare_id!("7ikNrDUaBf1Vk6KUagXzRvEz1Nhsep1PjixcqJH4vdSk");
pub mod site_fee_owner {
    anchor_lang::declare_id!("2Pv5mjmKYAtXNpr3mcsXf7HjtS3fieJeFoWPATVT5rWa");
}
#[program]
pub mod stable_pool {
    use super::*;

    // admin panel
    pub fn create_global_state(
        ctx: Context<CreateGlobalState>,
        global_state_nonce: u8,
        mint_usd_nonce: u8,
        tvl_limit: u64,
        debt_ceiling: u64,
    ) -> ProgramResult {
        ctx.accounts
            .create_state(global_state_nonce, mint_usd_nonce, tvl_limit, debt_ceiling)
    }

    #[access_control(is_admin(&ctx.accounts.global_state, &ctx.accounts.authority))]
    pub fn create_token_vault(
        ctx: Context<CreateTokenVault>,
        token_vault_nonce: u8,
        risk_level: u8,
        is_dual: u8,
        debt_ceiling: u64,
        platform_type: u8,
    ) -> ProgramResult {
        ctx.accounts.create_vault(
            token_vault_nonce,
            risk_level,
            is_dual,
            debt_ceiling,
            platform_type,
        )
    }

    #[access_control(is_admin(&ctx.accounts.global_state, &ctx.accounts.payer))]
    pub fn set_harvest_fee(
        ctx: Context<SetHarvestFee>,
        fee_num: u64,
        fee_deno: u64,
    ) -> ProgramResult {
        ctx.accounts.set_fee(fee_num, fee_deno)
    }

    #[access_control(is_admin(&ctx.accounts.global_state, &ctx.accounts.payer))]
    pub fn toggle_emer_state(ctx: Context<ToggleEmerState>, new_state: u8) -> ProgramResult {
        ctx.accounts.toggle_state(new_state)
    }

    #[access_control(is_admin(&ctx.accounts.global_state, &ctx.accounts.payer))]
    pub fn change_super_owner(ctx: Context<ChangeSuperOwner>) -> ProgramResult {
        ctx.accounts.change_owner()
    }

    #[access_control(is_admin(&ctx.accounts.global_state, &ctx.accounts.payer))]
    pub fn set_global_tvl_limit(ctx: Context<SetGlobalTvlLimit>, limit: u64) -> ProgramResult {
        ctx.accounts.set_tvL_limit(limit)
    }
    #[access_control(is_admin(&ctx.accounts.global_state, &ctx.accounts.payer))]
    pub fn set_global_debt_ceiling(
        ctx: Context<SetGlobalDebtCeiling>,
        ceiling: u64,
    ) -> ProgramResult {
        ctx.accounts.set(ceiling)
    }
    #[access_control(is_admin(&ctx.accounts.global_state, &ctx.accounts.payer))]
    pub fn set_vault_debt_ceiling(
        ctx: Context<SetVaultDebtCeiling>,
        ceiling: u64,
    ) -> ProgramResult {
        ctx.accounts.set(ceiling)
    }
    #[access_control(is_admin(&ctx.accounts.global_state, &ctx.accounts.payer))]
    pub fn set_user_debt_ceiling(ctx: Context<SetUserDebtCeiling>, ceiling: u64) -> ProgramResult {
        ctx.accounts.set(ceiling)
    }

    #[access_control(is_admin(&ctx.accounts.global_state, &ctx.accounts.payer))]
    pub fn set_collaterial_ratio(
        ctx: Context<SetCollateralRatio>,
        ratios: [u64; 10],
    ) -> ProgramResult {
        ctx.accounts.set_ratio(&ratios)
    }

    // user section
    pub fn create_user_trove(
        ctx: Context<CreateUserTrove>,
        user_trove_nonce: u8,
        token_coll_nonce: u8,
        ceiling: u64,
    ) -> ProgramResult {
        ctx.accounts
            .create(user_trove_nonce, token_coll_nonce, ceiling)
    }
    pub fn create_user_reward_vault(
        ctx: Context<CreateUserRewardVault>,
        reward_vault_nonce: u8,
    ) -> ProgramResult {
        ctx.accounts.create()
    }

    #[access_control(is_secure(&ctx.accounts.global_state))]
    pub fn deposit_collateral(ctx: Context<RatioStaker>, amount: u64) -> ProgramResult {
        ctx.accounts.deposit(amount)
    }

    #[access_control(is_secure(&ctx.accounts.global_state))]
    pub fn withdraw_collateral(ctx: Context<RatioStaker>, amount: u64) -> ProgramResult {
        ctx.accounts.withdraw(amount)
    }

    #[access_control(is_secure(&ctx.accounts.global_state))]
    pub fn borrow_usd(
        ctx: Context<BorrowUsd>,
        amount: u64,
        user_usd_token_nonce: u8,
    ) -> ProgramResult {
        ctx.accounts.borrow(amount, user_usd_token_nonce)
    }

    #[access_control(is_secure(&ctx.accounts.global_state))]
    pub fn repay_usd(ctx: Context<RepayUsd>, amount: u64) -> ProgramResult {
        ctx.accounts.repay(amount)
    }

    // quarry miner
    pub fn create_quarry_miner(
        ctx: Context<CreateQuarryMiner>,
        miner_bump: u8,
        miner_vault_bump: u8,
    ) -> ProgramResult {
        ctx.accounts.create(miner_bump, miner_vault_bump)
    }

    // saber functions
    #[access_control(is_secure(&ctx.accounts.ratio_staker.global_state))]
    pub fn deposit_to_saber(ctx: Context<SaberStaker>, amount: u64) -> ProgramResult {
        ctx.accounts.deposit(amount)
    }

    #[access_control(is_secure(&ctx.accounts.ratio_staker.global_state))]
    pub fn withdraw_from_saber(ctx: Context<SaberStaker>, amount: u64) -> ProgramResult {
        ctx.accounts.withdraw(amount)
    }

    #[access_control(is_secure(&ctx.accounts.ratio_harvester.global_state))]
    pub fn harvest_from_saber(ctx: Context<HarvestFromSaber>) -> ProgramResult {
        ctx.accounts.harvest()
    }
}
