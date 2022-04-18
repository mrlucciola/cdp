// libraries
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, get_associated_token_address, AssociatedToken},
    token::{Mint, Token, TokenAccount},
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
    // vault
    authority: AccountInfo<'info>,
    miner: AccountInfo<'info>,
    quarry: AccountInfo<'info>,
    // ata_collat_miner
    miner_vault: AccountInfo<'info>,
    token_mint: AccountInfo<'info>,
    rewarder: AccountInfo<'info>,
    payer: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
    authority_seeds: &[&[u8]],
    miner_bump: u8,
) -> Result<()> {
    msg!("miner-vault: {}", miner_vault.owner);
    let create_miner_ctx_accounts = CreateMiner {
        authority,
        miner,
        quarry,
        miner_vault,
        token_mint,
        rewarder,
        payer,
        token_program,
        system_program,
    };
    create_miner(
        CpiContext::new(quarry_program, create_miner_ctx_accounts)
            .with_signer(&[&authority_seeds[..]]),
        miner_bump,
    )
}

pub fn handle(ctx: Context<CreateSaberQuarryMiner>, miner_bump: u8) -> Result<()> {
    // verify that the pool is using the correct platform
    require!(
        ctx.accounts.pool.as_ref().platform_type == PlatformType::Saber as u8,
        // TODO 008: reword or delete
        StablePoolError::InvalidSaberPlatform
    );
    require!(
        ctx.accounts.vault.owner.to_bytes().as_ref()
            == ctx.accounts.authority.as_ref().key().to_bytes(),
        StablePoolError::InvalidOwner
    );

    let ata_collat_miner_check = get_associated_token_address(
        &ctx.accounts.authority.key(),
        &ctx.accounts.mint_collat.key(),
    );
    require!(
        ctx.accounts.ata_collat_miner.key() == ata_collat_miner_check,
        StateInvalidAddress
    );
    // let cpi_program = ctx.accounts.associated_token_program.to_account_info();
    // let cpi_accounts = associated_token::Create {
    //     payer: ctx.accounts.authority.to_account_info(),
    //     associated_token: ctx.accounts.ata_collat_miner.to_account_info(),
    //     authority: ctx.accounts.authority.to_account_info(),
    //     mint: ctx.accounts.mint_collat.to_account_info(),
    //     system_program: ctx.accounts.system_program.to_account_info(),
    //     token_program: ctx.accounts.associated_token_program.to_account_info(),
    //     rent: ctx.accounts.rent.to_account_info(),
    // };
    // let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    // associated_token::create(cpi_context)?;
    // add the ata to the vault
    ctx.accounts.vault.ata_collat_miner = ctx.accounts.ata_collat_miner.as_ref().key();

    msg!("i made it");

    let vault_owner_key = ctx.accounts.authority.as_ref().key();
    let vault_authority_seeds: &[&[u8]] = &[
        &VAULT_SEED,
        &ctx.accounts.vault.mint_collat.to_bytes(),
        &vault_owner_key.to_bytes(),
        &[ctx.accounts.vault.bump],
    ];

    create_miner_pda(
        ctx.accounts.quarry_program.to_account_info(),
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.miner.to_account_info(),
        ctx.accounts.quarry.to_account_info(),
        ctx.accounts.ata_collat_miner.to_account_info(),
        ctx.accounts.mint_collat.to_account_info(),
        ctx.accounts.rewarder.to_account_info().to_account_info(),
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        vault_authority_seeds,
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
        bump = pool.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint_collat.as_ref()
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        seeds = [VAULT_SEED.as_ref(), vault.mint_collat.as_ref(), authority.key().as_ref()],
        bump = vault.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint_collat.as_ref()
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
    #[account(mut, address = pool.mint_collat)]
    pub mint_collat: Box<Account<'info, Mint>>,

    // alias: miner_vault
    #[account(mut)]
    pub ata_collat_miner: Box<Account<'info, TokenAccount>>,

    /// CHECK: It will be validated by the QuarryMine Contract
    pub quarry_program: AccountInfo<'info>,

    // system
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
