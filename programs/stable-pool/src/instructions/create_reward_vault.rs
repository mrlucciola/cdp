// libraries
use anchor_lang::prelude::*;
use anchor_spl::associated_token::{self, AssociatedToken};
use anchor_spl::token::{self, Mint, Token, TokenAccount};
// local
use crate::{
    constants::*,
    states::{Pool, Vault},
};

pub fn handle(ctx: Context<CreateUserRewardVault>) -> Result<()> {
    if ctx.accounts.mint_reward.key() == ctx.accounts.pool.mint_reward_a {
        ctx.accounts.vault.reward_token_a = ctx.accounts.ata_reward_vault.key();
    } else {
        ctx.accounts.vault.reward_token_b = ctx.accounts.ata_reward_vault.key();
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct CreateUserRewardVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump, // TODO 004: precompute bump
        constraint = pool.mint_collat.as_ref() == vault.mint.as_ref(),
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        seeds = [VAULT_SEED.as_ref(), vault.mint.as_ref(), authority.key().as_ref()],
        bump, // TODO 004: precompute bump
        constraint = vault.owner.as_ref() == authority.key().as_ref(),
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        init,
        associated_token::mint = mint_reward,
        associated_token::authority = vault,
        payer = authority,
    )]
    pub ata_reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        constraint = mint_reward.key() == pool.mint_reward_a || mint_reward.key() == pool.mint_reward_b
    )]
    pub mint_reward: Box<Account<'info, Mint>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
