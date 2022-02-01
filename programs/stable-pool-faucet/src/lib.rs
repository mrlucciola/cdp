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

use crate::{instructions::*, processor::*};

declare_id!("8cWxdanpMMudwFexcZmmmZEZBBx2FzQFE2RjPNu7VgMB");

#[program]
pub mod stable_pool_faucet {
    use super::*;

    pub fn create_state(
        ctx: Context<CreateFaucetState>,
        state_nonce: u8,
        mint_usdc_usdx_lp_nonce: u8,
        mint_eth_sol_lp_nonce: u8,
        mint_atlas_ray_lp_nonce: u8,
        mint_samo_ray_lp_nonce: u8,
    ) -> ProgramResult {
        process_create_state(
            ctx,
            state_nonce,
            mint_usdc_usdx_lp_nonce,
            mint_eth_sol_lp_nonce,
            mint_atlas_ray_lp_nonce,
            mint_samo_ray_lp_nonce,
        )
    }
    pub fn faucet_usdc_usdx_lp(
        ctx: Context<FaucetUsdcUsdxLp>,
        state_nonce: u8,
        mint_lp_nonce: u8,
        user_token_lp_nonce: u8,
    ) -> ProgramResult {
        process_faucet_usdc_usdx_lp(ctx, state_nonce, mint_lp_nonce, user_token_lp_nonce)
    }
    pub fn faucet_eth_sol_lp(
        ctx: Context<FaucetEthSolLp>,
        state_nonce: u8,
        mint_lp_nonce: u8,
        user_token_lp_nonce: u8,
    ) -> ProgramResult {
        process_faucet_eth_sol_lp(ctx, state_nonce, mint_lp_nonce, user_token_lp_nonce)
    }
    pub fn faucet_atlas_ray_lp(
        ctx: Context<FaucetAtlasRayLp>,
        state_nonce: u8,
        mint_lp_nonce: u8,
        user_token_lp_nonce: u8,
    ) -> ProgramResult {
        process_faucet_atlas_ray_lp(ctx, state_nonce, mint_lp_nonce, user_token_lp_nonce)
    }
    pub fn faucet_samo_ray_lp(
        ctx: Context<FaucetSamoRayLp>,
        state_nonce: u8,
        mint_lp_nonce: u8,
        user_token_lp_nonce: u8,
    ) -> ProgramResult {
        process_faucet_samo_ray_lp(ctx, state_nonce, mint_lp_nonce, user_token_lp_nonce)
    }
}
