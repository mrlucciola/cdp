// libraries
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token};
// local
use crate::{constants::*, states::global_state::GlobalState};

pub fn handle(
    ctx: Context<CreateGlobalState>,
    global_state_bump: u8,
    mint_usdx_bump: u8,
    tvl_limit: u64,
    global_debt_ceiling: u64,
    user_debt_ceiling: u64,
    oracle_reporter: Pubkey,
) -> Result<()> {
    ctx.accounts.global_state.bump = global_state_bump;
    ctx.accounts.global_state.authority = ctx.accounts.authority.key();
    ctx.accounts.global_state.treasury = ctx.accounts.authority.key();
    ctx.accounts.global_state.mint_usdx = ctx.accounts.mint_usdx.key();
    ctx.accounts.global_state.mint_usdx_bump = mint_usdx_bump;
    ctx.accounts.global_state.tvl_limit = tvl_limit;
    ctx.accounts.global_state.tvl_usd = 0;
    ctx.accounts.global_state.total_debt = 0;
    ctx.accounts.global_state.global_debt_ceiling = global_debt_ceiling;
    ctx.accounts.global_state.user_debt_ceiling = user_debt_ceiling;
    ctx.accounts.global_state.fee_num = DEFAULT_FEE_NUMERATOR;
    ctx.accounts.global_state.fee_deno = DEFAULT_FEE_DENOMINATOR;
    ctx.accounts.global_state.coll_per_risklv = DEFAULT_RATIOS;
    ctx.accounts.global_state.oracle_reporter = oracle_reporter;
    ctx.accounts.global_state.paused = 0;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateGlobalState<'info> {
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
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        init,
        payer = authority,
        mint::decimals = DECIMALS_USDX,
        mint::authority = global_state,
        seeds = [MINT_USDX_SEED.as_ref()],
        bump,
    )]
    pub mint_usdx: Box<Account<'info, Mint>>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
