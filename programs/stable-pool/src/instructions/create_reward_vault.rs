use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use anchor_spl::associated_token::{self, AssociatedToken};

// local
use crate::{
    constants::*, 
    states::{Vault, Trove,},

};

impl<'info> CreateUserRewardVault<'info> {
    /// create ata for reward of user trove
    pub fn handle(&mut self) -> Result<()> {
        if self.reward_mint.key() == self.vault.reward_mint_a{
            self.trove.reward_token_a = self.reward_vault.key();
        }
        else {
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
        seeds = [VAULT_SEED, vault.mint.as_ref()],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        seeds = [TROVE_SEED, trove.mint.as_ref(), authority.key().as_ref()],
        bump,
    )]
    pub trove: Box<Account<'info, Trove>>,

    #[account(
        init,
        associated_token::mint = reward_mint,
        associated_token::authority = trove,
        payer = authority,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        constraint = reward_mint.key() == vault.reward_mint_a || reward_mint.key() == vault.reward_mint_b
    )]
    pub reward_mint: Box<Account<'info, Mint>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}