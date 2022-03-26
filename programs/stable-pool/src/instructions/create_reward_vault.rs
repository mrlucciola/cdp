use anchor_lang::prelude::*;
use anchor_spl::associated_token::{self, AssociatedToken};
use anchor_spl::token::{self, Mint, Token, TokenAccount};

// local
use crate::{
    constants::*,
    states::{Vault, Pool},
};

impl<'info> CreateUserRewardVault<'info> {
    /// create ata for reward of user vault
    pub fn handle(&mut self) -> Result<()> {
        if self.reward_mint.key() == self.pool.mint_reward_a {
            self.vault.reward_token_a = self.reward_vault.key();
        } else {
            self.vault.reward_token_b = self.reward_vault.key();
        }
        Ok(())
    }
}
#[derive(Accounts)]
#[instruction()]
pub struct CreateUserRewardVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [POOL_SEED, pool.mint_collat.as_ref()],
        bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        seeds = [VAULT_SEED, vault.mint.as_ref(), authority.key().as_ref()],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        init,
        associated_token::mint = reward_mint,
        associated_token::authority = vault,
        payer = authority,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        constraint = reward_mint.key() == pool.mint_reward_a || reward_mint.key() == pool.mint_reward_b
    )]
    pub reward_mint: Box<Account<'info, Mint>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
