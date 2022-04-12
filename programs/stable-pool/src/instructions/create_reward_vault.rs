// libraries
use crate::errors::StablePoolError;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::{self, AssociatedToken};
use anchor_spl::token::{self, Mint, Token, TokenAccount};
// local
use crate::{
    constants::*,
    states::{Pool, Vault},
};

pub fn handle(ctx: Context<CreateUserRewardVault>) -> Result<()> {
    require!(
        ctx.accounts.mint_reward.key() == ctx.accounts.pool.mint_reward,
        StablePoolError::RewardMintMismatch
    );
    // TODO 012: this is incorrect
    // ctx.accounts.vault.mint_reward = ctx.accounts.ata_reward_vault.key();

    Ok(())
}

#[derive(Accounts)]
pub struct CreateUserRewardVault<'info> {
    /// The primary user
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The pool for this given collateral token
    #[account(
        seeds = [POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump = pool.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint.as_ref(),
    )]
    pub pool: Box<Account<'info, Pool>>,

    /// The authority's vault
    #[account(
        mut,
        seeds = [VAULT_SEED.as_ref(), vault.mint.as_ref(), authority.key().as_ref()],
        bump = vault.bump,
        constraint = vault.owner.as_ref() == authority.key().as_ref(),
    )]
    pub vault: Box<Account<'info, Vault>>,

    /// The A.T.A. for the vault's reward token
    /// TODO 011: we should probanly remove this since rewards would go straight to the user
    /// unless this is necessary to redirect reward fees to treasury
    #[account(
        init,
        associated_token::mint = mint_reward,
        associated_token::authority = vault,
        payer = authority,
    )]
    pub ata_reward_vault: Box<Account<'info, TokenAccount>>,

    /// The reward token's mint account
    #[account(constraint = mint_reward.key() == pool.mint_reward)]
    pub mint_reward: Box<Account<'info, Mint>>,

    // system accounts
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
