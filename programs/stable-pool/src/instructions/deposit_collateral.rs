// modules
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
// local
use crate::{
    constants::*,
    errors::StablePoolError,
    states::{GlobalState, Trove, Vault},
    utils::assert_tvl_allowed,
};

pub fn handle(ctx: Context<DepositCollateral>, deposit_amount: u64) -> Result<()> {
    // validation
    assert_tvl_allowed(
        ctx.accounts.global_state.tvl_limit,
        ctx.accounts.global_state.tvl_usd,
        deposit_amount,
    )?;
    require!(
        ctx.accounts.ata_user.amount > 0,
        StablePoolError::InvalidTransferAmount,
    );

    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.ata_user.clone().to_account_info(),
            to: ctx.accounts.ata_trove.clone().to_account_info(),
            authority: ctx.accounts.authority.clone().to_account_info(),
        },
    );

    // send the transfer
    token::transfer(transfer_ctx, deposit_amount)?;

    ctx.accounts.vault.total_coll += deposit_amount;
    ctx.accounts.trove.locked_coll_balance += deposit_amount;

    Ok(())
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account[mut]]
    pub authority: Signer<'info>,
    #[account[mut]]
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
