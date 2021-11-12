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
    pub super_owner:  AccountInfo<'info>,
    #[account(
    init,
    seeds = [b"golbal-state-seed"],
    bump = nonce,
    payer = super_owner,
    )]
    pub global_state:Account<'info, GlobalState>,
    pub system_program: AccountInfo<'info>,

}

#[derive(Accounts)]
#[instruction(nonce:u8)]
pub struct CreateTokenVault<'info> {
    #[account(signer)]
    pub vault_owner:  AccountInfo<'info>,
    #[account(
    init,
    seeds = [b"token-vault-seed",token_coll.key().as_ref()],
    bump = nonce,
    payer = vault_owner,
    )]
    pub token_vault:Account<'info, TokenVault>,
    #[account(mut)]
    pub token_coll:Account<'info, TokenAccount>,
    pub system_program: AccountInfo<'info>,


}

#[derive(Accounts)]
#[instruction(nonce:u8)]
pub struct CreateUserTrove<'info> {
    #[account(signer)]
    pub trove_owner:  AccountInfo<'info>,
    #[account(
    init,
    seeds = [b"token-vault-seed",token_vault.key().as_ref(),trove_owner.key.as_ref()],
    bump = nonce,
    payer = trove_owner,
    )]
    pub user_trove:Account<'info, UserTrove>,
    #[account(mut)]
    pub token_vault:Account<'info, TokenVault>,
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositCollateral<'info> {
    #[account(signer)]
    pub owner:  AccountInfo<'info>,
    #[account(mut)]
    pub user_trove:Account<'info, UserTrove>,
    #[account(mut)]
    pub token_vault:Account<'info, TokenVault>,
    #[account(mut)]
    pub pool_token_coll:Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_coll:Account<'info, TokenAccount>,
    pub token_program:AccountInfo<'info>,
}
