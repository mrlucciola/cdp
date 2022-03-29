// libraries
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount},
};
use quarry_mine::{
    cpi::{accounts::CreateMiner, create_miner},
    Quarry, Rewarder,
};
// local
use crate::{
    constants::*,
    enums::PlatformType,
    errors::StablePoolError,
    states::{Pool, Vault},
};

pub fn create_miner_pda<'info>(
    quarry_program: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    miner: AccountInfo<'info>,
    quarry: AccountInfo<'info>,
    miner_vault: AccountInfo<'info>,
    token_mint: AccountInfo<'info>,
    rewarder: AccountInfo<'info>,
    payer: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
    authority_seeds: &[&[u8]],
    miner_bump: u8,
) -> Result<()> {
    create_miner(
        CpiContext::new(
            quarry_program,
            CreateMiner {
                authority,
                miner,
                quarry,
                miner_vault,
                token_mint,
                rewarder,
                payer,
                token_program,
                system_program,
            },
        )
        .with_signer(&[&authority_seeds[..]]),
        miner_bump,
    )
}

pub fn handle(ctx: Context<CreateSaberQuarryMiner>, miner_bump: u8) -> Result<()> {
    // verify that the pool is using the correct platform
    require!(
        ctx.accounts.pool.as_ref().platform_type == PlatformType::Saber as u8,
        StablePoolError::InvalidSaberPlatform
    );
    require!(
        ctx.accounts.vault.owner.to_bytes().as_ref()
            == ctx.accounts.authority.as_ref().key().to_bytes(),
        StablePoolError::InvalidOwner
    );

    let owner_key = ctx.accounts.authority.as_ref().key();
    let authority_seeds: &[&[u8]] = &[
        &VAULT_SEED,
        &ctx.accounts.vault.mint.to_bytes(),
        &owner_key.to_bytes(),
        &[ctx.accounts.vault.bump],
    ];

    create_miner_pda(
        ctx.accounts.quarry_program.to_account_info(),
        ctx.accounts.vault.to_account_info(),
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
pub struct CreateSaberQuarryMiner<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump=pool.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint.as_ref()
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        seeds = [VAULT_SEED.as_ref(), vault.mint.as_ref(), authority.key().as_ref()],
        bump=vault.bump,
        has_one = mint,
        constraint = pool.mint_collat.as_ref() == vault.mint.as_ref()
    )]
    pub vault: Box<Account<'info, Vault>>,

    /// [Miner] to be created.
    /// CHECK: This gets initialized by the quarry program, so it is just account info here
    #[account(mut)]
    pub miner: AccountInfo<'info>,

    #[account(mut)]
    pub quarry: Box<Account<'info, Quarry>>,
    /// what constraints
    #[account(mut)]
    pub rewarder: Box<Account<'info, Rewarder>>,
    /// the collateral
    #[account(mut)]
    pub mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        associated_token::mint = mint,
        associated_token::authority = miner,
        payer = authority,
    )]
    pub miner_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: It will be validated by the QuarryMine Contract
    pub quarry_program: AccountInfo<'info>,

    // system
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
