use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Faucet {
    pub super_owner: Pubkey,
    pub mint_usdc_usdx_lp: Pubkey,
    pub mint_eth_sol_lp: Pubkey,
    pub mint_atlas_ray_lp: Pubkey,
    pub mint_samo_ray_lp: Pubkey,
}
