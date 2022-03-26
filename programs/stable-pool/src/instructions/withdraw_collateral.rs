// modules
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
// local
use crate::{
    constants::*,
    errors::StablePoolError,
    states::{GlobalState, Trove, Vault}, // TODO: vault -> pool // TODO: trove -> vault
};

pub fn handle(ctx: Context<WithdrawCollateral>, withdraw_amount: u64) -> Result<()> {
    let accts = ctx.accounts;
    // validation
    require!(
        accts.ata_trove.amount > 0, // TODO: trove -> vault
        StablePoolError::InvalidTransferAmount,
    );
    require!(
        accts.trove.debt == 0, // TODO: trove -> vault
        StablePoolError::WithdrawNotAllowedWithDebt,
    );

    let trove_seeds: &[&[&[u8]]] = &[&[
        // TODO: trove -> vault
        TROVE_SEED.as_ref(), // TODO: trove -> vault
        &accts.mint.key().to_bytes(),
        &accts.authority.key().to_bytes(),
        &[accts.trove.bump], // TODO: trove -> vault
    ]];

    let transfer_ctx = CpiContext::new_with_signer(
        accts.token_program.to_account_info(),
        Transfer {
            from: accts.ata_trove.clone().to_account_info(), // TODO: trove -> vault
            to: accts.ata_user.clone().to_account_info(),
            authority: accts.trove.clone().to_account_info(), // TODO: trove -> vault
        },
        trove_seeds, // TODO: trove -> vault
    );

    // send the transfer
    token::transfer(transfer_ctx, withdraw_amount)?;

    accts.vault.total_coll -= withdraw_amount; // TODO: vault -> pool
    accts.trove.locked_coll_balance -= withdraw_amount; // TODO: trove -> vault

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
    #[account[mut]]
    pub authority: Signer<'info>,
    #[account[mut]]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        seeds=[VAULT_SEED.as_ref(), mint.key().as_ref()],// TODO: vault -> pool
        bump=vault.bump// TODO: vault -> pool
    )]
    pub vault: Box<Account<'info, Vault>>, // TODO: vault -> pool

    #[account(
        mut,
        seeds=[
            TROVE_SEED.as_ref(),// TODO: trove -> vault
            mint.key().as_ref(),
            authority.key().as_ref(),
        ],
        bump=trove.bump// TODO: trove -> vault
    )]
    pub trove: Box<Account<'info, Trove>>, // TODO: trove -> vault

    #[account(
        mut,
        associated_token::mint = mint.as_ref(),
        associated_token::authority = trove.as_ref(), // TODO: trove -> vault
    )]
    pub ata_trove: Account<'info, TokenAccount>, // TODO: trove -> vault

    #[account(
        mut,
        associated_token::mint = mint.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_user: Account<'info, TokenAccount>,

    // TODO: vault -> pool
    #[account(constraint = mint.key().as_ref() == vault.mint_collat.as_ref())]
    pub mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
