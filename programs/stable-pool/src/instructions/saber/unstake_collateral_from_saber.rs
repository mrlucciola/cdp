// libraries
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use quarry_mine::{
    cpi::{accounts::UserStake, withdraw_tokens},
    Miner, Quarry, Rewarder,
};
// local
use crate::{
    constants::*,
    enums::PlatformType,
    errors::StablePoolError,
    states::{GlobalState, Pool, Vault},
};

pub fn unstake_from_saber_pda<'info>(
    farm_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,

    user_authority: AccountInfo<'info>,

    quarry: AccountInfo<'info>,
    miner: AccountInfo<'info>,
    miner_vault: AccountInfo<'info>,

    token_account: AccountInfo<'info>,
    rewarder: AccountInfo<'info>,

    amount_to_unstake: u64,
    authority_seeds: &[&[u8]],
) -> Result<()> {
    // Unstake from saber
    withdraw_tokens(
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
        amount_to_unstake,
    )
}

/// Claims rewards from saber farm
pub fn handle(ctx: Context<UnstakeCollateralFromSaber>, amount_to_unstake: u64) -> Result<()> {
    ///////////////////unlock token from the miner vault in quarry////////
    let pool = &mut ctx.accounts.pool;
    require!(
        pool.platform_type == PlatformType::Saber as u8,
        // TODO 008: reword or delete
        StablePoolError::InvalidSaberPlatform
    );

    let mint_key = ctx.accounts.vault.mint_collat;
    let owner_key = ctx.accounts.authority.key();

    let authority_seeds = &[
        VAULT_SEED.as_ref(),
        mint_key.as_ref(),
        owner_key.as_ref(),
        &[ctx.accounts.vault.bump],
    ];
    unstake_from_saber_pda(
        ctx.accounts.quarry_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.quarry.to_account_info(),
        ctx.accounts.miner.to_account_info(),
        ctx.accounts.miner_vault.to_account_info(),
        ctx.accounts.ata_collat_vault.to_account_info(),
        ctx.accounts.rewarder.to_account_info(),
        amount_to_unstake,
        authority_seeds,
    )?;

    ///////////withdraw from user trove vault to user wallet //////////////////
    // validation
    ctx.accounts.ata_collat_vault.reload()?;
    require!(
        ctx.accounts.ata_collat_vault.amount > 0,
        StablePoolError::InvalidTransferAmount,
    );
    // require!(
    //     ctx.accounts.vault.debt == 0,
    //     StablePoolError::WithdrawNotAllowedWithDebt,
    // );

    // send the transfer
    // token::transfer(
    //     CpiContext::new_with_signer(
    //         ctx.accounts.token_program.to_account_info(),
    //         Transfer {
    //             from: ctx.accounts.ata_collat_vault.clone().to_account_info(),
    //             to: ctx.accounts.ata_collat_user.clone().to_account_info(),
    //             authority: ctx.accounts.vault.clone().to_account_info(),
    //         },
    //         &[&authority_seeds[..]],
    //     ),
    //     ctx.accounts.ata_collat_vault.amount,
    // )?;

    // TODO 014: update for checked math
    // TODO 015: We do not need these. replace with amount held at A.T.A.
    ctx.accounts.pool.total_coll -= amount_to_unstake;
    ctx.accounts.vault.deposited_collat_usd -= amount_to_unstake;

    Ok(())
}

#[derive(Accounts)]
pub struct UnstakeCollateralFromSaber<'info> {
    /// The client user account requesting to unstake
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The CDP platform global state
    #[account[mut]]
    pub global_state: Box<Account<'info, GlobalState>>,

    // The CDP-owned pool account, represents a single collateral type
    #[account(
        mut,
        seeds = [POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump = pool.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint_collat.as_ref(),
    )]
    pub pool: Box<Account<'info, Pool>>,

    // The user-owned vault account, represents a single collateral type for this user
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

    /// This is the collateral's A.T.A. for the user's vault
    #[account(
        mut,
        associated_token::mint = mint.as_ref(),
        associated_token::authority = vault.as_ref(),
    )]
    pub ata_collat_vault: Box<Account<'info, TokenAccount>>,

    /// This is the collateral's A.T.A. for the user
    #[account(
        mut,
        associated_token::mint = mint.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_collat_user: Box<Account<'info, TokenAccount>>,

    #[account(constraint = mint.key().as_ref() == pool.mint_collat.as_ref())]
    pub mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub quarry: Box<Account<'info, Quarry>>,

    #[account(mut)]
    pub miner: Box<Account<'info, Miner>>,

    // the miner (miner-vault's auth is miner, miner's auth is user), this is implemented as an ATA
    #[account(mut)]
    pub miner_vault: Box<Account<'info, TokenAccount>>,

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
