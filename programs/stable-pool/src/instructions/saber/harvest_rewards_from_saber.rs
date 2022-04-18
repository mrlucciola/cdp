// modules
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
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
    let auth = ctx.accounts.authority.key().clone();
    let accts = ctx.accounts;

    require!(
        accts.pool.platform_type == PlatformType::Saber as u8,
        // TODO 008: reword or delete
        StablePoolError::InvalidSaberPlatform
    );
    ////////////// harvest from saber first///////////////
    let authority_seeds = &[
        VAULT_SEED.as_ref(),
        accts.vault.mint_collat.as_ref(),
        auth.as_ref(),
        &[accts.vault.bump],
    ];

    claim_rewards(
        CpiContext::new(
            accts.quarry_program.to_account_info(),
            ClaimRewards {
                mint_wrapper: accts.mint_wrapper.to_account_info(),
                mint_wrapper_program: accts.mint_wrapper_program.to_account_info(),
                minter: accts.minter.to_account_info(),
                rewards_token_mint: accts.mint_reward.to_account_info(),
                rewards_token_account: accts.ata_reward_vault.to_account_info(),
                // claim_fee_token_account: accts.claim_fee_token_account.to_account_info(),
                claim_fee_token_account: accts.claim_fee_token_account.to_account_info(),
                stake: UserClaim {
                    authority: accts.vault.to_account_info(),
                    miner: accts.miner.to_account_info(),
                    quarry: accts.quarry.to_account_info(),
                    /// Placeholder for the miner vault.
                    unused_miner_vault: accts.ata_collat_miner.to_account_info(),
                    unused_token_account: accts.ata_collat_vault.to_account_info(),
                    token_program: accts.token_program.to_account_info(),
                    rewarder: accts.rewarder.to_account_info(),
                },
            },
        )
        .with_signer(&[&authority_seeds[..]]),
    )?;

    // calculate fee amt - to go to treasury
    let fee_amount = (accts.ata_reward_vault.amount as u128)
        .checked_mul(accts.global_state.fee_num as u128)
        .unwrap()
        .checked_div(accts.global_state.fee_deno as u128)
        .unwrap() as u64;
    // calc amt to go to user
    let user_amount = accts
        .ata_reward_vault
        .amount
        .checked_sub(fee_amount)
        .unwrap();

    let vault_seeds: &[&[&[u8]]] = &[&[
        VAULT_SEED.as_ref(),
        &accts.pool.mint_collat.to_bytes(),
        &accts.authority.key().to_bytes(),
        &[accts.vault.bump],
    ]];

    // user
    let transfer_to_user_ctx = CpiContext::new(
        accts.token_program.to_account_info(),
        Transfer {
            from: accts.ata_reward_vault.to_account_info(),
            to: accts.ata_reward_user.to_account_info(),
            authority: accts.vault.to_account_info(),
        },
    );
    let transfer_to_treasury_ctx = CpiContext::new(
        accts.token_program.to_account_info(),
        Transfer {
            from: accts.ata_reward_vault.to_account_info(),
            to: accts.ata_reward_cdp_treasury.to_account_info(),
            authority: accts.vault.to_account_info(),
        },
    );

    // send to treasury
    token::transfer(
        transfer_to_treasury_ctx.with_signer(vault_seeds),
        fee_amount,
    )?;

    // send to user
    token::transfer(transfer_to_user_ctx.with_signer(vault_seeds), user_amount)?;

    Ok(())
}

#[derive(Accounts)]
pub struct HarvestRewardsFromSaber<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: address is checked
    #[account(mut, address = global_state.treasury)]
    pub treasury: AccountInfo<'info>,

    // cdp-state accounts
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump = global_state.bump
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump = pool.bump,
        // constraint = pool.mint_collat.as_ref() == vault.mint_collat.as_ref(),
    )]
    pub pool: Box<Account<'info, Pool>>,

    // user-authored accounts
    /// The user's vault
    #[account(
        mut,
        seeds = [
            VAULT_SEED.as_ref(),
            vault.mint_collat.as_ref(),
            authority.key().as_ref(),
        ],
        bump = vault.bump,
        constraint = vault.owner.as_ref() == authority.key.as_ref(),
    )]
    pub vault: Box<Account<'info, Vault>>,

    /// The miner (auth is user)
    #[account(mut)]
    pub miner: Box<Account<'info, Miner>>,

    // Quarry-specific accounts
    // TODO: add quarry pub key to the pool acct
    /// Saber farm to stake to
    #[account(mut)]
    pub quarry: Box<Account<'info, Quarry>>,
    /// Saber farm reward account
    pub rewarder: Box<Account<'info, Rewarder>>,
    ///CHECK: It will be validated by the QuarryMine Contract
    #[account(mut)]
    pub mint_wrapper: AccountInfo<'info>,
    ///CHECK: It will be validated by the QuarryMine Contract
    pub mint_wrapper_program: AccountInfo<'info>,
    ///CHECK: It will be validated by the QuarryMine Contract
    #[account(mut)]
    pub minter: AccountInfo<'info>,
    /// Quarry: Token account in which the rewards token fees are collected.
    #[account(mut)]
    pub claim_fee_token_account: Account<'info, TokenAccount>,

    // A.T.A.s
    /**
     * the miner (miner-vault's auth is miner, miner's auth is user), this is implemented as an ATA
     */
    #[account(
        mut,
        associated_token::mint = mint_reward.as_ref(),
        associated_token::authority = treasury.as_ref(),
    )]
    pub ata_reward_cdp_treasury: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = mint_reward.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_reward_user: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = mint_reward.as_ref(),
        associated_token::authority = vault.as_ref(),
    )]
    pub ata_reward_vault: Box<Account<'info, TokenAccount>>,
    // alias: miner_vault
    #[account(
        mut,
        associated_token::mint = mint_collat,
        associated_token::authority = miner,
    )]
    pub ata_collat_miner: Box<Account<'info, TokenAccount>>,
    /// A.T.A. for collateral token for vault
    #[account(
        mut,
        associated_token::mint = mint_collat.as_ref(),
        associated_token::authority = vault.as_ref(),
    )]
    pub ata_collat_vault: Box<Account<'info, TokenAccount>>,

    // Mint accounts
    /// The mint account for reward token
    #[account(mut, address = pool.mint_reward)]
    pub mint_reward: Box<Account<'info, Mint>>,
    /// The mint account for collateral token
    #[account(address = pool.mint_collat)]
    pub mint_collat: Box<Account<'info, Mint>>,

    ///CHECK: It will be validated by the QuarryMine Contract
    pub quarry_program: AccountInfo<'info>,

    // system accounts
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
