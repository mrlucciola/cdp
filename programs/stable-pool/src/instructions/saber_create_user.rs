// libraries
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount},
};
use quarry_mine::{ Miner, Quarry, Rewarder};
// local
use crate::{
    constants::*,
    states::{Trove, Vault},
    enums::PlatformType,
    errors::StablePoolError,
    utils::pda_bump,
    saber_utils::create_miner_pda,
};
impl<'info> CreateQuarryMiner<'info> {
    /// Claims rewards from saber farm
    pub fn handle(&mut self, miner_bump: u8) -> Result<()> {
        let vault = &mut self.vault;

        require!(
            vault.platform_type == PlatformType::Saber as u8,
            StablePoolError::InvalidSaberPlatform
        );

        let vault_key = vault.key();
        let owner_key = self.payer.key();
        let bump = pda_bump(&[
            TROVE_SEED.as_ref(),
            vault_key.as_ref(),
            owner_key.as_ref(),]);
        let authority_seeds = &[
            TROVE_SEED.as_ref(),
            vault_key.as_ref(),
            owner_key.as_ref(),
            &[bump],
        ];
        create_miner_pda(
            self.quarry_program.to_account_info(),
            self.trove.to_account_info(),
            self.miner.to_account_info(),
            self.quarry.to_account_info(),
            self.miner_vault.to_account_info(),
            self.token_mint.to_account_info(),
            self.rewarder.to_account_info(),
            self.payer.to_account_info(),
            self.token_program.to_account_info(),
            self.system_program.to_account_info(),
            authority_seeds,
            miner_bump,
        )
    }
}

#[derive(Accounts)]
#[instruction(miner_bump:u8)]
pub struct CreateQuarryMiner<'info> {
    // can we rename to authority
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, token_mint.key().as_ref()],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        seeds = [
            TROVE_SEED,
            vault.key().as_ref(),
            payer.key().as_ref(),
        ],
        bump,
    )]
    pub trove: Box<Account<'info, Trove>>,


    #[account(mut)]
    pub miner: Account<'info, Miner>,

    #[account(mut)]
    pub quarry: Account<'info, Quarry>,
    pub rewarder: Account<'info, Rewarder>,
    pub token_mint: Account<'info, Mint>,

    #[account(init,
        associated_token::mint = token_mint,
        associated_token::authority = miner,
        payer = payer,
    )]
    pub miner_vault: Box<Account<'info, TokenAccount>>,

    ///CHECK: It will be validated by the QuarryMine Contract
    pub quarry_program: AccountInfo<'info,>,
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
