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
/// utils
pub mod utils;
/// pyth
pub mod pyth;
/// raydium
pub mod raydium;
use crate::{
    instructions::*,
    processor::*,
};

declare_id!("2VGZsqQvLWVcqoTuW6qyGs894pjpZA6AeUoD91SZhuv7");

#[program]
pub mod stable_pool {
    use super::*;

    pub fn create_global_state(ctx: Context<CreateGlobalState>, global_state_nonce:u8, mint_usd_nonce:u8, tvl_limit:u64) -> ProgramResult { 
        process_create_global_state(ctx, global_state_nonce, mint_usd_nonce, tvl_limit) 
    }
    pub fn create_token_vault(ctx: Context<CreateTokenVault>, token_vault_nonce:u8, risk_level: u8) -> ProgramResult { 
        process_create_token_vault(ctx, token_vault_nonce, risk_level)
    }
    pub fn create_user_trove(ctx: Context<CreateUserTrove>, user_trove_nonce:u8, token_coll_nonce:u8) -> ProgramResult { 
        process_create_user_trove(ctx, user_trove_nonce, token_coll_nonce) 
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> ProgramResult { 
        process_deposit_collateral(ctx, amount) 
    }
    pub fn withdraw_collateral(ctx: Context<WithdrawCollateral>, amount: u64) -> ProgramResult { 
        process_withdraw_collateral(ctx, amount) 
    }

    pub fn borrow_usd(ctx: Context<BorrowUsd>, amount: u64, user_usd_token_nonce: u8) -> ProgramResult { 
        process_borrow_usd(ctx, amount, user_usd_token_nonce) 
    }
    pub fn repay_usd(ctx: Context<RepayUsd>, amount: u64) -> ProgramResult { 
        process_repay_usd(ctx, amount) 
    }
    pub fn deposit_raydium_collateral(ctx: Context<DepositRaydiumCollateral>, amount: u64) -> ProgramResult { 
        process_deposit_raydium_collateral(ctx, amount) 
    }
    pub fn withdraw_raydium_collateral(ctx: Context<WithdrawRaydiumCollateral>, amount: u64) -> ProgramResult { 
        process_withdraw_raydium_collateral(ctx, amount) 
    }

    // orca integration
    pub fn create_orca_vault(ctx: Context<CreateOrcaVault>, is_dd: u8, orca_vault_nonce: u8) -> ProgramResult {
        process_create_orca_vault(ctx, is_dd, orca_vault_nonce)
    }

    pub fn init_orca_farm(ctx: Context<InitRatioUserFarm>, ratio_authority_bump: u8) -> ProgramResult {
        process_init_orca_farm(ctx, ratio_authority_bump)
    }

    pub fn deposit_orca_lp(ctx: Context<DepositOrcaLP>, amount: u64, ratio_authority_bump : u8) -> ProgramResult { 
        process_deposit_orcalp(ctx, amount, ratio_authority_bump)
    }

    pub fn withdraw_orca_lp(ctx: Context<WithdrawOrcaLP>, amount: u64, ratio_authority_bump : u8) -> ProgramResult { 
        process_withdraw_orcalp(ctx, amount, ratio_authority_bump) 
    }

    pub fn harvest_reward(ctx: Context<HarvestReward>, ratio_authority_bump: u8) -> ProgramResult { 
        process_harvest_reward(ctx, ratio_authority_bump)
    }
}