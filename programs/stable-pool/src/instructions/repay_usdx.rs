// libraries
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Burn, Mint, Token, TokenAccount},
};
// local
use crate::{
    constants::*,
    errors::*,
    states::{global_state::GlobalState, Pool, Vault},
};

pub fn handle(ctx: Context<RepayUsdx>, repay_amount: u64) -> Result<()> {
    require!(
        repay_amount <= ctx.accounts.vault.debt,
        StablePoolError::RepayingMoreThanBorrowed,
    );
    require!(repay_amount > 0, StablePoolError::InvalidTransferAmount,);
    // burn
    let cpi_accounts = Burn {
        mint: ctx.accounts.mint_usdx.to_account_info().clone(),
        to: ctx.accounts.ata_usdx.to_account_info().clone(),
        authority: ctx.accounts.authority.to_account_info().clone(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info().clone();

    let signer_seeds = &[GLOBAL_STATE_SEED, &[ctx.accounts.global_state.bump]];
    let signer = &[&signer_seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::burn(cpi_ctx, repay_amount)?;

    // TODO: do final sanity check that the math is correct
    // require!(future_total_debt_pool - orig_total_debt_pool == repay_amount);
    // require!(future_total_debt_global_state - orig_total_debt_global_state == repay_amount);
    // require!(future_total_debt_vault - orig_total_debt_vault == repay_amount);

    ctx.accounts.pool.total_debt = ctx
        .accounts
        .pool
        .total_debt
        .checked_sub(repay_amount)
        .unwrap();
    ctx.accounts.global_state.total_debt_usdx = ctx
        .accounts
        .global_state
        .total_debt_usdx
        .checked_sub(repay_amount)
        .unwrap();
    ctx.accounts.vault.debt = ctx.accounts.vault.debt.checked_sub(repay_amount).unwrap();

    Ok(())
}

#[derive(Accounts)]
pub struct RepayUsdx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump = global_state.bump
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump = pool.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint_collat.as_ref(),
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        seeds = [
            VAULT_SEED.as_ref(),
            vault.mint_collat.as_ref(),
            authority.key().as_ref(),
        ],
        bump = vault.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint_collat.as_ref(),
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        seeds = [MINT_USDX_SEED.as_ref()],
        bump,
        constraint = mint_usdx.key() == global_state.mint_usdx,
    )]
    pub mint_usdx: Box<Account<'info, Mint>>,

    #[account(
        associated_token::mint = mint_usdx.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_usdx: Box<Account<'info, TokenAccount>>,

    // system accounts
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
