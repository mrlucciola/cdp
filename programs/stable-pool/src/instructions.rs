use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, ID};


use crate::{
    states::*,
    error::*,
    constant::*,
    processor::*,
};


#[derive(Accounts)]
#[instruction(nonce:u8)]
pub struct CreateGlobalState <'info>{
    #[account(signer)]
    owner:  AccountInfo<'info>,

}

#[derive(Accounts)]
#[instruction(nonce:u8)]
pub struct CreateTokenVault<'info> {
    #[account(signer)]
    owner:  AccountInfo<'info>,
    #[account(mut)]
    token_a:Account<'info, TokenAccount>,
    #[account(mut)]
    token_b:Account<'info, TokenAccount>,
    #[account(mut)]
    token_lp:Account<'info, TokenAccount>,

}

#[derive(Accounts)]
#[instruction(nonce:u8)]
pub struct CreateUserTrove<'info> {
    #[account(signer)]
    owner:  AccountInfo<'info>,
    #[account(mut)]
    token_vault:Account<'info, TokenVault>,
}

#[derive(Accounts)]
#[instruction()]
pub struct LockLp {}
