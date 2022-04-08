// libraries
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token};
// local
use crate::{
    constants::*,
    enums::PlatformType,
    errors::StablePoolError,
    states::{GlobalState, Pool},
};

pub fn handle(
    ctx: Context<CreatePool>,
    pool_bump: u8,
    risk_level: u8,
    is_dual: u8,
    debt_ceiling: u64,
    platform_type: u8,
    mint_token_a: Pubkey,
    mint_token_b: Pubkey,
    reward_mints: Vec<Pubkey>,
    token_a_decimals: u8,
    token_b_decimals: u8,
) -> Result<()> {
    // Set the default values for this pool
    ctx.accounts.pool.mint_collat = ctx.accounts.mint_collat.key();
    ctx.accounts.pool.total_coll = 0;
    ctx.accounts.pool.total_debt = 0;
    ctx.accounts.pool.risk_level = risk_level;
    ctx.accounts.pool.bump = pool_bump;
    ctx.accounts.pool.is_dual = is_dual;
    ctx.accounts.pool.debt_ceiling = debt_ceiling;
    ctx.accounts.pool.token_a_decimals = token_a_decimals;
    ctx.accounts.pool.token_b_decimals = token_b_decimals;
    ctx.accounts.pool.mint_token_a = mint_token_a;
    ctx.accounts.pool.mint_token_b = mint_token_b;

    // make sure platform value is in range
    require!(
        platform_type < PlatformType::Unknown as u8,
        StablePoolError::InvalidPlatformType
    );
    ctx.accounts.pool.platform_type = platform_type;

    // make sure there is the right number of reward mints
    require!(
        reward_mints.len() > 0 && reward_mints.len() <= 2,
        StablePoolError::InvalidRewardMintCount
    );

    ctx.accounts.pool.mint_reward_a = reward_mints[0];
    if reward_mints.len() > 1 {
        ctx.accounts.pool.mint_reward_b = reward_mints[1];
    }

    Ok(())
}

// TODO 003: Refactor to be specific to 2-coin pools
#[derive(Accounts)]
pub struct CreatePool<'info> {
    /// The authority for this pool, should be the same auth as global state
    #[account(mut, constraint = authority.as_ref().key().to_string() == global_state.authority.to_string().as_ref())]
    pub authority: Signer<'info>,

    /// The pool account
    #[account(
        init,
        payer = authority,
        seeds = [POOL_SEED.as_ref(), mint_collat.key().as_ref()],
        bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    /// The global state
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump, // TODO 004: precompute bump
        has_one = authority,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    /// The mint account for collateral token
    pub mint_collat: Box<Account<'info, Mint>>,

    // system accounts
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
