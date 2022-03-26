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
    states::{Pool, Trove},
};

pub fn handle(ctx: Context<CreateSaberQuarryMiner>, miner_bump: u8) -> Result<()> {
    // let pool = ctx.accounts.pool.as_ref();

    // require!(
    //     pool.platform_type == PlatformType::Saber as u8,
    //     StablePoolError::InvalidSaberPlatform
    // );

    let owner_key = ctx.accounts.authority.as_ref().key();

    let authority_seeds: &[&[u8]] = &[
        &TROVE_SEED,
        &ctx.accounts.trove.mint.to_bytes(), // TODO: rename trove -> vault
        &owner_key.to_bytes(),
        &[ctx.accounts.trove.bump], // TODO: rename trove -> vault
    ];
    create_miner_pda(
        ctx.accounts.quarry_program.to_account_info(),
        ctx.accounts.trove.to_account_info(), // TODO: rename trove -> vault
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
pub struct CreateSaberQuarryMiner<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.mint_collat.as_ref()],
        bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        seeds = [
            TROVE_SEED,
            trove.mint.as_ref(),// TODO: rename trove -> vault
            authority.key().as_ref(),
        ],
        bump,
        has_one = mint
    )]
    pub trove: Box<Account<'info, Trove>>, // TODO: rename trove -> vault

    ///CHECK: intialized in quarry contract
    #[account(mut)]
    pub miner: AccountInfo<'info>,

    #[account(mut)]
    pub quarry: Box<Account<'info, Quarry>>,
    /// what constraints
    pub rewarder: Box<Account<'info, Rewarder>>,
    /// what constraints
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
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
