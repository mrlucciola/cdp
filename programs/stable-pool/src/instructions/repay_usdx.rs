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
    states::{global_state::GlobalState, Trove, Vault},// TODO: vault -> pool
};

pub fn handle(ctx: Context<RepayUsdx>, repay_amount: u64) -> Result<()> {
    require!(
        repay_amount <= ctx.accounts.trove.debt,// TODO: trove -> vault
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

    ctx.accounts.vault.total_debt -= repay_amount; // TODO: vault -> pool
    ctx.accounts.global_state.total_debt -= repay_amount;
    ctx.accounts.trove.debt -= repay_amount; // TODO: trove -> vault

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
    pub global_state: Account<'info, GlobalState>,
    #[account(
        mut,
        seeds=[VAULT_SEED.as_ref(), vault.mint_collat.as_ref()],// TODO: vault -> pool
        bump=vault.bump,// TODO: vault -> pool
        constraint = vault.mint_collat.as_ref() == trove.mint.as_ref(),// TODO: vault -> pool // TODO: trove -> vault
    )]
    pub vault: Box<Account<'info, Vault>>, // TODO: vault -> pool
    #[account(
        mut,
        seeds=[
            TROVE_SEED.as_ref(),// TODO: trove -> vault
            trove.mint.as_ref(),// TODO: trove -> vault
            authority.key().as_ref(),
        ],
        bump=trove.bump,// TODO: trove -> vault
        constraint = vault.mint_collat.as_ref() == trove.mint.as_ref(),// TODO: vault -> pool // TODO: trove -> vault
    )]
    pub trove: Box<Account<'info, Trove>>,// TODO: trove -> vault
    #[account(
        seeds=[MINT_USDX_SEED],
        bump,
        constraint=mint_usdx.key() == global_state.mint_usdx,
    )]
    pub mint_usdx: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer=authority,
        associated_token::mint = mint_usdx.as_ref(),
        associated_token::authority = authority.as_ref(),
        seeds=[USER_USDX_SEED, authority.key().as_ref(), mint_usdx.key().as_ref()],
        bump,
    )]
    pub ata_usdx: Box<Account<'info, TokenAccount>>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
