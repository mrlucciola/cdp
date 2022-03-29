// modules
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
// local
use crate::{
    constants::*,
    errors::StablePoolError,
    states::{GlobalState, Pool, Vault},
};

pub fn handle(ctx: Context<WithdrawCollateral>, withdraw_amount: u64) -> Result<()> {
    let accts = ctx.accounts;
    // validation
    require!(
        accts.ata_vault.amount > 0,
        StablePoolError::InvalidTransferAmount,
    );
    require!(
        accts.vault.debt == 0,
        StablePoolError::WithdrawNotAllowedWithDebt,
    );

    let vault_seeds: &[&[&[u8]]] = &[&[
        VAULT_SEED.as_ref(),
        &accts.mint.key().to_bytes(),
        &accts.authority.key().to_bytes(),
        &[accts.vault.bump],
    ]];

    let transfer_ctx = CpiContext::new_with_signer(
        accts.token_program.to_account_info(),
        Transfer {
            from: accts.ata_vault.clone().to_account_info(),
            to: accts.ata_user.clone().to_account_info(),
            authority: accts.vault.clone().to_account_info(),
        },
        vault_seeds,
    );

    // send the transfer
    token::transfer(transfer_ctx, withdraw_amount)?;

    accts.pool.total_coll -= withdraw_amount;
    accts.vault.locked_coll_balance -= withdraw_amount;

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
        seeds=[POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump=pool.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint.as_ref(),
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        seeds=[
            VAULT_SEED.as_ref(),
            mint.key().as_ref(),
            authority.key().as_ref(),
        ],
        bump=vault.bump
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        associated_token::mint = mint.as_ref(),
        associated_token::authority = vault.as_ref(),
    )]
    pub ata_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_user: Account<'info, TokenAccount>,

    #[account(constraint = mint.key().as_ref() == pool.mint_collat.as_ref())]
    pub mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
