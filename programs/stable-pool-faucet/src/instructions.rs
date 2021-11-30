use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount,Mint};


use crate::{
    states::*,
    constant::*,
};

#[derive(Accounts)]
#[instruction(state_nonce:u8, mint_usdc_usdx_lp_nonce:u8, mint_eth_sol_lp_nonce:u8, mint_atlas_ray_lp_nonce:u8, mint_samo_ray_lp_nonce:u8)]
pub struct CreateFaucetState <'info>{
    pub super_owner:  Signer<'info>,

    #[account(
    init,
    seeds = [FAUCET_TAG],
    bump = state_nonce,
    payer = super_owner,
    )]
    pub faucet_state:ProgramAccount<'info, Faucet>,

    #[account(init,
        mint::decimals = LP_DECIMALS,
        mint::authority = faucet_state,
        seeds = [LP_USDC_USDX_TAG],
        bump = mint_usdc_usdx_lp_nonce,
        payer = super_owner)]
    pub mint_usdc_usdx_lp:Account<'info, Mint>,

    #[account(init,
        mint::decimals = LP_DECIMALS,
        mint::authority = faucet_state,
        seeds = [LP_ETH_SOL_TAG],
        bump = mint_eth_sol_lp_nonce,
        payer = super_owner)]
    pub mint_eth_sol_lp:Account<'info, Mint>,

    #[account(init,
        mint::decimals = LP_DECIMALS,
        mint::authority = faucet_state,
        seeds = [LP_ATLAS_RAY_TAG],
        bump = mint_atlas_ray_lp_nonce,
        payer = super_owner)]
    pub mint_atlas_ray_lp:Account<'info, Mint>,
    
    #[account(init,
        mint::decimals = LP_DECIMALS,
        mint::authority = faucet_state,
        seeds = [LP_SAMO_RAY_TAG],
        bump = mint_samo_ray_lp_nonce,
        payer = super_owner)]
    pub mint_samo_ray_lp:Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(state_nonce: u8, mint_lp_nonce: u8, user_token_lp_nonce: u8)]
pub struct FaucetUsdcUsdxLp<'info> {
    pub owner:  Signer<'info>,
    
    #[account(mut,
        seeds = [FAUCET_TAG],
        bump = state_nonce)]
    pub faucet_state: ProgramAccount<'info, Faucet>,

    #[account(mut,
        seeds = [LP_USDC_USDX_TAG],
        bump = mint_lp_nonce,
        constraint = mint_lp.key() == faucet_state.mint_usdc_usdx_lp
    )]
    pub mint_lp:Account<'info, Mint>,

    #[account(init_if_needed,
        token::mint = mint_lp,
        token::authority = owner,
        seeds = [USER_USDC_USDX_TAG, owner.key().as_ref(), mint_lp.key().as_ref()],
        bump = user_token_lp_nonce,
        payer = payer)]
    pub user_token_lp:Account<'info, TokenAccount>,

    pub token_program:Program<'info, Token>,
}


#[derive(Accounts)]
#[instruction(state_nonce: u8, mint_lp_nonce: u8)]
pub struct FaucetEthSolLp<'info> {
    pub owner:  Signer<'info>,
    
    #[account(mut,
        seeds = [FAUCET_TAG],
        bump = state_nonce)]
    pub faucet_state: ProgramAccount<'info, Faucet>,

    #[account(mut,
        seeds = [LP_ETH_SOL_TAG],
        bump = mint_lp_nonce,
        constraint = mint_lp.key() == faucet_state.mint_eth_sol_lp
    )]
    pub mint_lp:Account<'info, Mint>,

    #[account(mut,
        constraint = user_token_lp.owner == owner.key(),
        constraint = user_token_lp.mint == mint_lp.key())]
    pub user_token_lp:Account<'info, TokenAccount>,

    pub token_program:Program<'info, Token>,
}


#[derive(Accounts)]
#[instruction(state_nonce: u8, mint_lp_nonce: u8)]
pub struct FaucetAtlasRayLp<'info> {
    pub owner:  Signer<'info>,
    
    #[account(mut,
        seeds = [FAUCET_TAG],
        bump = state_nonce)]
    pub faucet_state: ProgramAccount<'info, Faucet>,

    #[account(mut,
        seeds = [LP_ATLAS_RAY_TAG],
        bump = mint_lp_nonce,
        constraint = mint_lp.key() == faucet_state.mint_atlas_ray_lp
    )]
    pub mint_lp:Account<'info, Mint>,

    #[account(mut,
        constraint = user_token_lp.owner == owner.key(),
        constraint = user_token_lp.mint == mint_lp.key())]
    pub user_token_lp:Account<'info, TokenAccount>,

    pub token_program:Program<'info, Token>,
}


#[derive(Accounts)]
#[instruction(state_nonce: u8, mint_lp_nonce: u8)]
pub struct FaucetSamoRayLp<'info> {
    pub owner:  Signer<'info>,
    
    #[account(mut,
        seeds = [FAUCET_TAG],
        bump = state_nonce)]
    pub faucet_state: ProgramAccount<'info, Faucet>,

    #[account(mut,
        seeds = [LP_SAMO_RAY_TAG],
        bump = mint_lp_nonce,
        constraint = mint_lp.key() == faucet_state.mint_samo_ray_lp
    )]
    pub mint_lp:Account<'info, Mint>,

    #[account(mut,
        constraint = user_token_lp.owner == owner.key(),
        constraint = user_token_lp.mint == mint_lp.key())]
    pub user_token_lp:Account<'info, TokenAccount>,

    pub token_program:Program<'info, Token>,
}
