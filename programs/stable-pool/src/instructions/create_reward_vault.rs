use anchor_lang::prelude::*;
use anchor_spl::associated_token::{self, AssociatedToken};
use anchor_spl::token::{self, Mint, Token, TokenAccount};

// local
use crate::{
    constants::*,
    // TODO: rename vault -> pool
    // TODO: rename trove -> vault
    states::{Trove, Vault},
};

impl<'info> CreateUserRewardVault<'info> {
    /// create ata for reward of user trove
    pub fn handle(&mut self) -> Result<()> {
        if self.reward_mint.key() == self.vault.mint_reward_a {
            // TODO: rename vault -> pool
            // TODO: rename trove -> vault
            self.trove.reward_token_a = self.reward_vault.key();
        } else {
            // TODO: rename vault -> pool
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
        seeds = [VAULT_SEED, vault.mint_collat.as_ref()],// TODO: rename vault -> pool
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>, // TODO: rename vault -> pool

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
        constraint = reward_mint.key() == vault.mint_reward_a || reward_mint.key() == vault.mint_reward_b// TODO: rename vault -> pool
    )]
    pub reward_mint: Box<Account<'info, Mint>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
