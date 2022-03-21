// TODO: fully replace saber_create_user because it was improperly named
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
    // enums::PlatformType,
    // errors::StablePoolError,
    saber_utils::create_miner_pda,
    states::{Trove, Vault},
};

pub fn handle(ctx: Context<CreateQuarryMiner>, miner_bump: u8) -> Result<()> {
    // this is not a user vault - bad prior naming convention, to be changed after MVP
    // let vault = ctx.accounts.vault.as_ref();

    // require!(
    //     vault.platform_type == PlatformType::Saber as u8,
    //     StablePoolError::InvalidSaberPlatform
    // );

    let owner_key = ctx.accounts.authority.as_ref().key();
    // let bump: u8 = ctx.accounts.trove.bump;
    // let bump = pda_bump(&[TROVE_SEED.as_ref(), mint_key.as_ref(), owner_key.as_ref()]);
    // let authority_seeds = &[
    //     TROVE_SEED.as_ref(),
    //     mint_key.as_ref(),
    //     owner_key.as_ref(),
    //     &[bump],
    // ];

    let authority_seeds: &[&[u8]] = &[
        &TROVE_SEED,
        &ctx.accounts.trove.mint.to_bytes(),
        &owner_key.to_bytes(),
        &[ctx.accounts.trove.bump],
    ];
    create_miner_pda(
        ctx.accounts.quarry_program.to_account_info(),
        ctx.accounts.trove.to_account_info(),
        ctx.accounts.miner.to_account_info(),
        ctx.accounts.quarry.to_account_info(),
        ctx.accounts.miner_vault.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.rewarder.to_account_info().to_account_info(),
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        authority_seeds,
        miner_bump,
    )?;

    Ok(())
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
    pub quarry: Box<Account<'info, Quarry>>,
    pub rewarder: Box<Account<'info, Rewarder>>,

    pub mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        associated_token::mint = mint,
        associated_token::authority = miner,
        payer = authority,
    )]
    pub miner_vault: Box<Account<'info, TokenAccount>>,

    ///CHECK: It will be validated by the QuarryMine Contract
    pub quarry_program: AccountInfo<'info>,
    // #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    // #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
