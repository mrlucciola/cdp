use anchor_lang::prelude::*;

use crate::instructions::*;

pub fn process_create_state(
    ctx: Context<CreateFaucetState>,
    state_nonce: u8,
    mint_usdc_usdx_lp_nonce: u8,
    mint_eth_sol_lp_nonce: u8,
    mint_atlas_ray_lp_nonce: u8,
    mint_samo_ray_lp_nonce: u8,
) -> ProgramResult {
    ctx.accounts.faucet_state.authority = ctx.accounts.authority.key();
    ctx.accounts.faucet_state.mint_usdc_usdx_lp = ctx.accounts.mint_usdc_usdx_lp.key();
    ctx.accounts.faucet_state.mint_eth_sol_lp = ctx.accounts.mint_eth_sol_lp.key();
    ctx.accounts.faucet_state.mint_atlas_ray_lp = ctx.accounts.mint_atlas_ray_lp.key();
    ctx.accounts.faucet_state.mint_samo_ray_lp = ctx.accounts.mint_samo_ray_lp.key();
    Ok(())
}
