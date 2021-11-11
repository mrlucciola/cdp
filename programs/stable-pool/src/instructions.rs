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
    #[account(
    init,
    seeds = [b"golbal-state-seed"],
    bump = nonce,
    payer = owner,
    )]
    global_state:Account<'info, GlobalState>,
    system_program: AccountInfo<'info>,

}

#[derive(Accounts)]
#[instruction(nonce:u8)]
pub struct CreateTokenVault<'info> {
    #[account(signer)]
    owner:  AccountInfo<'info>,
    #[account(
    init,
    seeds = [b"token-vault-seed",token_a.key().as_ref(),token_b.key().as_ref()],
    bump = nonce,
    payer = owner,
    )]
    token_vault:Account<'info, TokenVault>,
    #[account(mut)]
    token_a:Account<'info, TokenAccount>,
    #[account(mut)]
    token_b:Account<'info, TokenAccount>,
    #[account(mut)]
    token_lp:Account<'info, TokenAccount>,
    system_program: AccountInfo<'info>,


}

#[derive(Accounts)]
#[instruction(nonce:u8)]
pub struct CreateUserTrove<'info> {
    #[account(signer)]
    owner:  AccountInfo<'info>,
    #[account(
    init,
    seeds = [b"token-vault-seed",token_vault.key().as_ref(),owner.key.as_ref()],
    bump = nonce,
    payer = owner,
    )]
    user_trove:Account<'info, UserTrove>,
    #[account(mut)]
    token_vault:Account<'info, TokenVault>,
    system_program: AccountInfo<'info>,

}

#[derive(Accounts)]
#[instruction()]
pub struct LockLp {}
