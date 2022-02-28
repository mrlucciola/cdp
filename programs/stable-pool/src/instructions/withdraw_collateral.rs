// modules
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
// local
use crate::{
    constants::*,
    errors::StablePoolError,
    states::{GlobalState, Trove, Vault},
};

pub fn handle(ctx: Context<WithdrawCollateral>, withdraw_amount: u64) -> Result<()> {
    // validation
    require!(
        ctx.accounts.ata_trove.amount > 0,
        StablePoolError::InvalidTransferAmount,
    );
    let trove_seeds: &[&[&[u8]]] = &[&[
        &TROVE_SEED,
        &ctx.accounts.mint.key().to_bytes(),
        &ctx.accounts.authority.key().to_bytes(),
        &[ctx.accounts.trove.bump],
    ]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.ata_trove.clone().to_account_info(),
            to: ctx.accounts.ata_user.clone().to_account_info(),
            authority: ctx.accounts.trove.clone().to_account_info(),
        },
        trove_seeds,
    );

    // send the transfer
    token::transfer(transfer_ctx, withdraw_amount)?;

    ctx.accounts.vault.total_coll -= withdraw_amount;
    ctx.accounts.trove.locked_coll_balance -= withdraw_amount;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
    #[account[mut]]
    pub authority: Signer<'info>,
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        seeds=[VAULT_SEED.as_ref(), mint.key().as_ref()],
        bump=vault.bump
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        seeds=[
            TROVE_SEED.as_ref(),
            mint.key().as_ref(),
            authority.key().as_ref(),
        ],
        bump=trove.bump
    )]
    pub trove: Box<Account<'info, Trove>>,

    #[account(
        mut,
        associated_token::mint = mint.as_ref(),
        associated_token::authority = trove.as_ref(),
    )]
    pub ata_trove: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_user: Account<'info, TokenAccount>,

    #[account(constraint = mint.key().as_ref() == vault.mint.as_ref())]
    pub mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
