use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Faucet {
    pub authority: Pubkey,
    pub mint_usdc_usdx_lp: Pubkey,
    // pub mint_wtust_usdc_lp: Pubkey,
    pub mint_eth_sol_lp: Pubkey,
    // pub mint_usdc_usdt_lp: Pubkey,
    pub mint_atlas_ray_lp: Pubkey,
    // pub mint_ust_3pool_lp: Pubkey,
    pub mint_samo_ray_lp: Pubkey,
    // pub mint_usdc_cash_lp: Pubkey,
}
