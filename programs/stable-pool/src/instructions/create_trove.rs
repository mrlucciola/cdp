// libraries
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
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
    ceiling: u64,
) -> Result<()> {
    ctx.accounts.trove.locked_coll_balance = 0;
    ctx.accounts.trove.debt = 0;
    ctx.accounts.trove.bump = trove_bump;
    ctx.accounts.trove.ata_trove_bump = ata_trove_bump;
    ctx.accounts.trove.debt_ceiling = ceiling;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateTrove<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [VAULT_SEED.as_ref(), vault.mint_coll.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Box<Account<'info, Vault>>, // prev: TokenVault

    #[account(
        init,
        seeds = [
            TROVE_SEED.as_ref(),
            vault.key().as_ref(),
            authority.key().as_ref()
        ],
        bump,
        payer = authority,
    )]
    pub trove: Box<Account<'info, Trove>>,

    // ata might not be the correct term
    #[account(
        init,
        // token::mint = mint_coll,
        // token::authority = trove,
        associated_token::mint = mint_coll,
        associated_token::authority = trove,
        seeds = [
            TROVE_POOL_SEED.as_ref(),
            trove.key().as_ref(),
            mint_coll.key().as_ref(),
        ],
        bump,
        payer = authority,
    )]
    pub ata_trove: Box<Account<'info, TokenAccount>>,

    #[account(constraint = mint_coll.key() == vault.mint_coll)]
    pub mint_coll: Box<Account<'info, Mint>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
