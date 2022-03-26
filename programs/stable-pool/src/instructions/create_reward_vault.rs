use anchor_lang::prelude::*;
use anchor_spl::associated_token::{self, AssociatedToken};
use anchor_spl::token::{self, Mint, Token, TokenAccount};

// local
use crate::{
    constants::*,
    // TODO: rename trove -> vault
    states::{Trove, Pool},
};

impl<'info> CreateUserRewardVault<'info> {
    /// create ata for reward of user trove
    pub fn handle(&mut self) -> Result<()> {
        if self.reward_mint.key() == self.pool.mint_reward_a {
            // TODO: rename trove -> vault
            self.trove.reward_token_a = self.reward_vault.key();
        } else {
            // TODO: rename trove -> vault
            self.trove.reward_token_b = self.reward_vault.key();
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
        seeds = [TROVE_SEED, trove.mint.as_ref(), authority.key().as_ref()],// TODO: rename trove -> vault
        bump,
    )]
    pub trove: Box<Account<'info, Trove>>, // TODO: rename trove -> vault

    #[account(
        init,
        associated_token::mint = reward_mint,
        associated_token::authority = trove,
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
