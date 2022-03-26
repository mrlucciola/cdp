// libraries
use anchor_lang::prelude::*;
use anchor_spl::associated_token::{self, AssociatedToken};
use anchor_spl::token::{self, Mint, Token, TokenAccount};
// local
use crate::{
    constants::*,
    states::{Pool, Vault},
};

pub fn handle(
    ctx: Context<CreateVault>,
    vault_bump: u8,
    ata_vault_bump: u8, // TODO: remove
) -> Result<()> {
    ctx.accounts.vault.mint = ctx.accounts.mint.key();
    ctx.accounts.vault.locked_coll_balance = 0;
    ctx.accounts.vault.debt = 0;
    ctx.accounts.vault.bump = vault_bump;
    ctx.accounts.vault.ata_vault_bump = ata_vault_bump;
    // ctx.accounts.vault.pool = ctx.accounts.pool;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        init,
        seeds = [
            VAULT_SEED.as_ref(),
            mint.key().as_ref(),
            authority.key().as_ref(),
        ],
        bump,
        payer = authority,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        init,
        associated_token::mint = mint.as_ref(),
        associated_token::authority = vault.as_ref(),
        payer = authority,
    )]
    pub ata_vault: Box<Account<'info, TokenAccount>>,

    // mint for the collateral that is being deposited into the vault
    #[account(constraint = mint.key().as_ref() == pool.mint_collat.as_ref())]
    pub mint: Box<Account<'info, Mint>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
