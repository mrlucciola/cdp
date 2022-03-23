// libraries
use anchor_lang::prelude::*;
use anchor_spl::associated_token::{self, AssociatedToken};
use anchor_spl::token::{self, Mint, Token, TokenAccount};
// local
use crate::{
    constants::*,
    states::{Trove, Vault},
};

pub fn handle(
    ctx: Context<CreateTrove>,
    trove_bump: u8,
    ata_trove_bump: u8,
    // vault_bump: u8,
) -> Result<()> {
    ctx.accounts.trove.mint = ctx.accounts.mint.key();
    ctx.accounts.trove.locked_coll_balance = 0;
    ctx.accounts.trove.debt = 0;
    ctx.accounts.trove.bump = trove_bump;
    ctx.accounts.trove.ata_trove_bump = ata_trove_bump;
    // ctx.accounts.trove.vault = ctx.accounts.vault;
    // ctx.accounts.trove.vault_bump = ctx.accounts.vault;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateTrove<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [VAULT_SEED.as_ref(), vault.mint.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        init,
        seeds = [
            TROVE_SEED.as_ref(),
            mint.key().as_ref(),
            authority.key().as_ref(),
        ],
        bump,
        payer = authority,
    )]
    pub trove: Box<Account<'info, Trove>>,

    #[account(
        init,
        associated_token::mint = mint.as_ref(),
        associated_token::authority = trove.as_ref(),
        payer = authority,
    )]
    pub ata_trove: Box<Account<'info, TokenAccount>>,

    // mint for the collateral that is being deposited into the trove
    #[account(constraint = mint.key().as_ref() == vault.mint.as_ref())]
    pub mint: Box<Account<'info, Mint>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
