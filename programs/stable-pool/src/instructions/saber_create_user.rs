// TODO: delete after verifying orig create_miner is fully implemented
// libraries
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount},
};
use quarry_mine::{Quarry, Rewarder};
// local
use crate::{
    constants::*,
    enums::PlatformType,
    errors::StablePoolError,
    saber_utils::create_miner_pda,
    states::{Trove, Vault},
    utils::pda_bump,
};
impl<'info> CreateQuarryMiner<'info> {
    pub fn handle(&mut self, miner_bump: u8) -> Result<()> {
        let vault = &mut self.vault;

        require!(
            vault.platform_type == PlatformType::Saber as u8,
            StablePoolError::InvalidSaberPlatform
        );

        let mint_key = self.trove.mint;
        let owner_key = self.authority.key();
        let bump = pda_bump(&[TROVE_SEED.as_ref(), mint_key.as_ref(), owner_key.as_ref()]);
        let authority_seeds = &[
            TROVE_SEED.as_ref(),
            mint_key.as_ref(),
            owner_key.as_ref(),
            &[bump],
        ];
        create_miner_pda(
            self.quarry_program.to_account_info(),
            self.trove.to_account_info(),
            self.miner.to_account_info(),
            self.quarry.to_account_info(),
            self.miner_vault.to_account_info(),
            self.mint.to_account_info(),
            self.rewarder.to_account_info(),
            self.authority.to_account_info(),
            self.token_program.to_account_info(),
            self.system_program.to_account_info(),
            authority_seeds,
            miner_bump,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(miner_bump:u8)]
pub struct CreateQuarryMiner<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, vault.mint.as_ref()],
        bump,
        has_one = mint
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        seeds = [
            TROVE_SEED,
            trove.mint.as_ref(),
            authority.key().as_ref(),
        ],
        bump,
        has_one = mint
    )]
    pub trove: Box<Account<'info, Trove>>,

    ///CHECK: intialized in quarry contract
    #[account(mut)]
    pub miner: AccountInfo<'info>,

    #[account(mut)]
    pub quarry: Account<'info, Quarry>,
    pub rewarder: Account<'info, Rewarder>,

    pub mint: Account<'info, Mint>,

    #[account(init,
        associated_token::mint = mint,
        associated_token::authority = miner,
        payer = authority,
    )]
    pub miner_vault: Box<Account<'info, TokenAccount>>,

    ///CHECK: It will be validated by the QuarryMine Contract
    pub quarry_program: AccountInfo<'info>,
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
