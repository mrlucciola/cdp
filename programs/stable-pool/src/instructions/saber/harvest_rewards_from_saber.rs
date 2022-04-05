// modules
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token, TokenAccount},
};
use quarry_mine::{
    cpi::{
        accounts::{ClaimRewards, UserClaim},
        claim_rewards,
    },
    Miner, Quarry, Rewarder,
};
// local
use crate::{
    constants::*,
    enums::PlatformType,
    errors::StablePoolError,
    states::{GlobalState, Pool, Vault},
};

pub fn handle(ctx: Context<HarvestRewardsFromSaber>) -> Result<()> {
    require!(
        ctx.accounts.pool.platform_type == PlatformType::Saber as u8,
        StablePoolError::InvalidSaberPlatform
    );
    ////////////// harvest from saber first///////////////
    let mint_key = ctx.accounts.vault.mint;
    let owner_key = ctx.accounts.authority.key();
    let bump = ctx.accounts.vault.bump;
    let authority_seeds = &[
        VAULT_SEED.as_ref(),
        mint_key.as_ref(),
        owner_key.as_ref(),
        &[bump],
    ];

    claim_rewards(
        CpiContext::new(
            ctx.accounts.quarry_program.to_account_info(),
            ClaimRewards {
                mint_wrapper: ctx.accounts.mint_wrapper.to_account_info(),
                mint_wrapper_program: ctx.accounts.mint_wrapper_program.to_account_info(),
                minter: ctx.accounts.minter.to_account_info(),
                rewards_token_mint: ctx.accounts.mint_reward.to_account_info(),
                rewards_token_account: ctx.accounts.ata_reward_vault.to_account_info(),
                // claim_fee_token_account: ctx.accounts.claim_fee_token_account.to_account_info(),
                claim_fee_token_account: ctx.accounts.claim_fee_token_account.to_account_info(),
                stake: UserClaim {
                    authority: ctx.accounts.vault.to_account_info(),
                    miner: ctx.accounts.miner.to_account_info(),
                    quarry: ctx.accounts.quarry.to_account_info(),
                    /// Placeholder for the miner vault.
                    unused_miner_vault: ctx.accounts.miner_vault.to_account_info(),
                    unused_token_account: ctx.accounts.ata_vault.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    rewarder: ctx.accounts.rewarder.to_account_info(),
                },
            },
        )
        .with_signer(&[&authority_seeds[..]]),
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct HarvestRewardsFromSaber<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump = global_state.bump
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds=[POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump=pool.bump,
        // constraint = pool.mint_collat.as_ref() == vault.mint.as_ref(),
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        seeds=[
            VAULT_SEED.as_ref(),
            vault.mint.as_ref(),
            authority.key().as_ref(),
        ],
        bump=vault.bump,
        // constraint = pool.mint_collat.as_ref() == vault.mint.as_ref(),
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(mut, constraint = ata_reward_vault.key() == vault.reward_token_a)]
    pub ata_reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        associated_token::mint = mint_reward,
        associated_token::authority = authority,
        payer = authority,
    )]
    pub ata_user_reward: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint_reward,
        associated_token::authority = treasury,
    )]
    pub ata_cdp_treasury: Box<Account<'info, TokenAccount>>,

    #[account(mut, address = global_state.treasury)]
    /// CHECK: address is checked
    pub treasury: AccountInfo<'info>,

    // the collateral mint account
    #[account(constraint = mint.key() == pool.mint_collat)]
    pub mint: Box<Account<'info, Mint>>,

    /// saber farm to stake to
    #[account(mut)]
    pub quarry: Box<Account<'info, Quarry>>,

    // the miner (auth is user)
    #[account(mut)]
    pub miner: Box<Account<'info, Miner>>,

    /// the miner (miner-vault's auth is miner, miner's auth is user), this is implemented as an ATA
    /// but we are not appending ata_ to the beginning to match the quarry implementation
    #[account(mut)]
    pub miner_vault: Box<Account<'info, TokenAccount>>,

    /// associated collateral token account for vault
    #[account(
        mut,
        associated_token::mint = mint.as_ref(),
        associated_token::authority = vault.as_ref(),
    )]
    pub ata_vault: Box<Account<'info, TokenAccount>>,

    // saber farm common
    pub rewarder: Box<Account<'info, Rewarder>>,

    ///CHECK: It will be validated by the QuarryMine Contract
    #[account(mut)]
    pub mint_wrapper: AccountInfo<'info>,

    ///CHECK: It will be validated by the QuarryMine Contract
    pub mint_wrapper_program: AccountInfo<'info>,

    ///CHECK: It will be validated by the QuarryMine Contract
    #[account(mut)]
    pub minter: AccountInfo<'info>,

    #[account(mut, address = pool.mint_reward_a)]
    pub mint_reward: Box<Account<'info, Mint>>,

    /// Quarry: Token account in which the rewards token fees are collected.
    #[account(mut)]
    pub claim_fee_token_account: Account<'info, TokenAccount>,
    ///CHECK: It will be validated by the QuarryMine Contract
    pub quarry_program: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
