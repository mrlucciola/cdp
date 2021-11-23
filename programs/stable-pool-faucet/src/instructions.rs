use anchor_lang::prelude::*;
use anchor_spl_token::token::{Token, TokenAccount,Mint};


use crate::{
    states::*,
    constant::*,
};

#[derive(Accounts)]
#[instruction(state_nonce:u8, mint_lp_nonce:u8)]
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
        seeds = [LP_TAG],
        bump = mint_lp_nonce,
        payer = super_owner)]
    pub mint_lp:Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64, state_nonce: u8, mint_lp_nonce: u8)]
pub struct FaucetLp<'info> {
    pub owner:  Signer<'info>,
    
    #[account(mut,
        seeds = [FAUCET_TAG],
        bump = state_nonce)]
    pub faucet_state: ProgramAccount<'info, Faucet>,

    #[account(mut,
        seeds = [LP_TAG],
        bump = mint_lp_nonce,
        constraint = mint_lp.key() == faucet_state.mint_lp
    )]
    pub mint_lp:Account<'info, Mint>,

    #[account(
        constraint = user_token_lp.owner == owner.key(),
        constraint = user_token_lp.mint == mint_lp.key())]
    pub user_token_lp:Account<'info, TokenAccount>,

    pub token_program:Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}
