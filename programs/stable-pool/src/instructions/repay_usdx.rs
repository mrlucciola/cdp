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

pub fn handle(ctx: Context<RepayUsdx>, amt_to_repay: u64) -> Result<()> {
    let accts = ctx.accounts;

    // make sure repay amount is less than or equal to the current vault debt
    require!(
        amt_to_repay <= accts.vault.debt,
        StablePoolError::RepayingMoreThanBorrowed,
    );
    // make sure repay amt is greater than zero
    require!(amt_to_repay > 0, StablePoolError::InvalidTransferAmount);

    // Build and send burn instruction
    let cpi_accounts = Burn {
        mint: accts.mint_usdx.to_account_info().clone(),
        to: accts.ata_usdx.to_account_info().clone(),
        authority: accts.authority.to_account_info().clone(),
        // authority: accts.ata_usdx.to_account_info().clone(),
    };

    let cpi_program = accts.token_program.to_account_info().clone();

    // let signer_seeds = &[GLOBAL_STATE_SEED, &[accts.global_state.bump]];
    let signer_seeds = &[accts.ata_usdx.key().to_bytes()];

    // let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::burn(cpi_ctx, amt_to_repay)?;

    // TODO: do final sanity check that the math is correct
    // require!(future_total_debt_pool - orig_total_debt_pool == amt_to_repay);
    // require!(future_total_debt_global_state - orig_total_debt_global_state == amt_to_repay);
    // require!(future_total_debt_vault - orig_total_debt_vault == amt_to_repay);

    accts.pool.total_debt = accts.pool.total_debt.checked_sub(amt_to_repay).unwrap();
    accts.global_state.total_debt_usdx = accts
        .global_state
        .total_debt_usdx
        .checked_sub(amt_to_repay)
        .unwrap();
    accts.vault.debt = accts.vault.debt.checked_sub(amt_to_repay).unwrap();

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
        mut,
        seeds = [MINT_USDX_SEED.as_ref()],
        bump,
        constraint = mint_usdx.key() == global_state.mint_usdx,
    )]
    pub mint_usdx: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = mint_usdx.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_usdx: Box<Account<'info, TokenAccount>>,

    // system accounts
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
}
