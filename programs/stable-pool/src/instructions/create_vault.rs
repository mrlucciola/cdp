// libraries
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token};
// local
use crate::{
    constants::*,
    enums::PlatformType,
    errors::StablePoolError,
    states::{GlobalState, Vault},
};

pub fn handle(
    ctx: Context<CreateVault>,
    vault_bump: u8,
    risk_level: u8,
    is_dual: u8,
    debt_ceiling: u64,
    platform_type: u8,
    reward_mints: Vec<Pubkey>,
) -> Result<()> {
    ctx.accounts.vault.mint = ctx.accounts.mint.key();
    ctx.accounts.vault.total_coll = 0;
    ctx.accounts.vault.total_debt = 0;
    ctx.accounts.vault.risk_level = risk_level;
    ctx.accounts.vault.bump = vault_bump;
    ctx.accounts.vault.is_dual = is_dual;
    ctx.accounts.vault.debt_ceiling = debt_ceiling;

    require!(
        platform_type < PlatformType::Unknown as u8,
        StablePoolError::InvalidPlatformType
    );
    ctx.accounts.vault.platform_type = platform_type;

    require!(reward_mints.len() > 0 && reward_mints.len() <= 2, StablePoolError::InvalidRewardMintCount);

    ctx.accounts.vault.reward_mint_a = reward_mints[0];
    if reward_mints.len() > 1 {
        ctx.accounts.vault.reward_mint_b = reward_mints[1];
    }

    Ok(())
}

#[derive(Accounts)]
pub struct CreateVault<'info> {
    #[account(
        mut,
        // this is for LOCALNET and DEVNET. Please change key for mainnet
        //      maybe add custom error handling, not a priority
        constraint = authority.as_ref().key().to_string() == "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi"
    )]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        seeds = [VAULT_SEED.as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump,
        has_one = authority,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    pub mint: Box<Account<'info, Mint>>,
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
