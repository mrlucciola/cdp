use anchor_lang::prelude::*;
use anchor_spl::token::{self,  MintTo, ID};

use crate::{
    error::*,
    constant::*,
    instructions::*,
};

pub fn process_faucet_samo_ray_lp(ctx: Context<FaucetSamoRayLp>, state_nonce: u8, mint_lp_nonce: u8, user_token_lp_nonce: u8) -> ProgramResult {

    // mint to user
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint_lp.to_account_info().clone(),
        to: ctx.accounts.user_token_lp.to_account_info().clone(),
        authority: ctx.accounts.faucet_state.to_account_info().clone(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info().clone();
    
    let signer_seeds = &[
        FAUCET_TAG,
        &[state_nonce],
    ];
    let signer = &[&signer_seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::mint_to(cpi_ctx, LP_SAMO_RAY_AMOUNT)?;

    Ok(())
}
