// libraries
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use quarry_mine::{
    cpi::{accounts::UserStake, stake_tokens},
    Miner, Quarry, Rewarder,
};
// local
use crate::{
    constants::*,
    enums::PlatformType,
    errors::StablePoolError,
    states::{GlobalState, Pool, Vault},
};

pub fn stake_to_saber_cpi<'info>(
    farm_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,

    user_authority: AccountInfo<'info>,

    quarry: AccountInfo<'info>,
    miner: AccountInfo<'info>,
    miner_vault: AccountInfo<'info>,

    token_account: AccountInfo<'info>,
    rewarder: AccountInfo<'info>,

    amount: u64,
    authority_seeds: &[&[u8]],
) -> Result<()> {
    stake_tokens(
        CpiContext::new(
            farm_program,
            UserStake {
                authority: user_authority,
                quarry,
                miner,
                miner_vault,
                token_account,
                token_program,
                rewarder,
            },
        )
        .with_signer(&[&authority_seeds[..]]),
        amount,
    )?;

    Ok(())
}

pub fn handle(
    ctx: Context<StakeCollateralToSaber>,
    amt_to_stake_requested: Option<u64>,
) -> Result<()> {
    ///////////deposit to user vault first //////////////////

    let amt_to_stake: u64 = amt_to_stake_requested.unwrap_or(ctx.accounts.ata_collat_vault.amount);

    // validation
    require!(
        ctx.accounts.ata_collat_vault.amount > 0,
        StablePoolError::InvalidTransferAmount,
    );

    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.ata_collat_vault.clone().to_account_info(),
            to: ctx.accounts.ata_collat_miner.clone().to_account_info(),
            authority: ctx.accounts.authority.clone().to_account_info(),
        },
    );

    // send the transfer
    token::transfer(transfer_ctx, amt_to_stake)?;

    // TODO 014: update for checked math
    ctx.accounts.pool.total_coll += amt_to_stake;
    ctx.accounts.vault.deposited_collat_usd += amt_to_stake;

    ///////////////////lock token to the miner vault in quarry////////
    ctx.accounts.ata_collat_vault.reload()?;
    let pool = &mut ctx.accounts.pool;
    require!(
        pool.platform_type == PlatformType::Saber as u8,
        // TODO 008: reword or delete
        StablePoolError::InvalidPlatformNotSaber
    );

    let mint_key = ctx.accounts.vault.mint_collat;
    let owner_key = ctx.accounts.authority.key();

    let authority_seeds = &[
        VAULT_SEED.as_ref(),
        mint_key.as_ref(),
        owner_key.as_ref(),
        &[ctx.accounts.vault.bump],
    ];
    stake_to_saber_cpi(
        ctx.accounts.quarry_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.quarry.to_account_info(),
        ctx.accounts.miner.to_account_info(),
        ctx.accounts.ata_collat_miner.to_account_info(),
        ctx.accounts.ata_collat_vault.to_account_info(),
        ctx.accounts.rewarder.to_account_info(),
        ctx.accounts.ata_collat_vault.amount,
        authority_seeds,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct StakeCollateralToSaber<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account[mut]]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds=[POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump=pool.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint_collat.as_ref(),
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        seeds=[
            VAULT_SEED.as_ref(),
            vault.mint_collat.as_ref(),
            authority.key().as_ref(),
        ],
        bump=vault.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint_collat.as_ref(),
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        associated_token::mint = mint_collat.as_ref(),
        associated_token::authority = vault.as_ref(),
    )]
    pub ata_collat_vault: Box<Account<'info, TokenAccount>>,

    /**
     * the miner (miner-vault's auth is miner, miner's auth is user), this is implemented as an ATA
     * alias: miner_vault
     */
    #[account(mut)]
    pub ata_collat_miner: Box<Account<'info, TokenAccount>>,

    #[account(constraint = mint_collat.key().as_ref() == pool.mint_collat.as_ref())]
    pub mint_collat: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub quarry: Box<Account<'info, Quarry>>,

    #[account(mut)]
    pub miner: Box<Account<'info, Miner>>,

    //saber farm common
    #[account(mut)]
    pub rewarder: Box<Account<'info, Rewarder>>,

    ///CHECK: It will be validated by the QuarryMine Contract
    pub quarry_program: AccountInfo<'info>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
}
