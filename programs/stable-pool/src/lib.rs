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

declare_id!("7kKokDY8zXMpWgN8yUrBKqvwoB57vXPhzGDC4dJDvWER");
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

    pub fn create_vault(
        ctx: Context<CreateVault>,
        vault_bump: u8,
        risk_level: u8,
        is_dual: u8,
        debt_ceiling: u64,
        platform_type: u8,
    ) -> ProgramResult {
        ctx.accounts.create_vault(
            vault_bump,
            risk_level,
            is_dual,
            debt_ceiling,
            platform_type,
        )
    }

    pub fn set_harvest_fee(
        ctx: Context<SetHarvestFee>,
        fee_num: u64,
        fee_deno: u64,
    ) -> ProgramResult {
        ctx.accounts.set_fee(fee_num, fee_deno)
    }

    pub fn toggle_emer_state(ctx: Context<ToggleEmerState>, new_state: u8) -> ProgramResult {
        ctx.accounts.toggle_state(new_state)
    }

    // no tests yet
    pub fn change_authority(ctx: Context<ChangeAuthority>) -> ProgramResult {
        ctx.accounts.change_owner()
    }

    
    pub fn set_global_tvl_limit(ctx: Context<SetGlobalTvlLimit>, limit: u64) -> ProgramResult {
        ctx.accounts.set_tvl_limit(limit)
    }
    
    pub fn set_global_debt_ceiling(
        ctx: Context<SetGlobalDebtCeiling>,
        ceiling: u64,
    ) -> ProgramResult {
        ctx.accounts.set(ceiling)
    }
    
    pub fn set_vault_debt_ceiling(
        ctx: Context<SetVaultDebtCeiling>,
        ceiling: u64,
    ) -> ProgramResult {
        ctx.accounts.set(ceiling)
    }

    pub fn set_user_debt_ceiling(ctx: Context<SetUserDebtCeiling>, ceiling: u64) -> ProgramResult {
        ctx.accounts.set(ceiling)
    }

    pub fn set_collaterial_ratio(
        ctx: Context<SetCollateralRatio>,
        ratios: [u64; 10],
    ) -> ProgramResult {
        ctx.accounts.set_ratio(&ratios)
    }

    // user section
    pub fn create_trove(
        ctx: Context<CreateTrove>,
        trove_nonce: u8,
        ata_trove_nonce: u8,
        ceiling: u64,
    ) -> ProgramResult {
        ctx.accounts
            .create(trove_nonce, ata_trove_nonce, ceiling)
    }
    pub fn create_user_reward_vault(
        ctx: Context<CreateUserRewardVault>,
        reward_vault_bump: u8,
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

    #[access_control(is_secure(&ctx.accounts.global_state))]
    pub fn create_price_feed(ctx: Context<CreatePriceFeed>, pair_count: u8) -> ProgramResult {
        ctx.accounts.create_price_feed(pair_count)
    }
    pub fn update_price_feed(ctx: Context<UpdatePriceFeed>) -> ProgramResult {
        ctx.accounts.update_price_feed()
    }
}
