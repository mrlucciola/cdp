use anchor_lang::prelude::*;

use anchor_spl::token::{self, Mint, Token};

// constants
pub const DEFAULT_FEE_NUMERATOR: u128 = 3;
pub const DEFAULT_FEE_DENOMINATOR: u128 = 1000;
pub const USDX_DECIMALS: u8 = 6;
pub const MINT_USDX_SEED: &[u8] = b"MINT_USDX_SEED";
pub const GLOBAL_STATE_SEED: &[u8] = b"GLOBAL_STATE_SEED";
pub const DEFAULT_RATIOS: [u64; 10] = [
    99009901, // AAA
    97799511, // AA
    96618357, // A
    95011876, // BBB
    93023256, // BB
    91116173, // B
    90090090, // CCC
    89086860, // CC
    88105727, // C
    86206897, // D
];

declare_id!("FvTjLbwbHY4v8Gfv18JKuPCJG2Hj87CG8kPNHqGeHAR4");

#[program]
pub mod stable_pool {
    use std::{io::Read, str::FromStr};

    use super::*;

    pub fn create_global_state(
        ctx: Context<CreateGlobalState>,
        global_state_bump: u8,
        mint_usdx_nonce: u8,
        tvl_limit: u64,
        debt_ceiling: u64,
    ) -> Result<()> {
        ctx.accounts.global_state.bump = global_state_bump;
        ctx.accounts.global_state.authority = ctx.accounts.authority.key();
        ctx.accounts.global_state.mint_usdx = ctx.accounts.mint_usdx.key();
        ctx.accounts.global_state.mint_usdx_nonce = mint_usdx_nonce;
        ctx.accounts.global_state.tvl_limit = tvl_limit;
        ctx.accounts.global_state.tvl = 0;
        ctx.accounts.global_state.total_debt = 0;
        ctx.accounts.global_state.debt_ceiling = debt_ceiling;
        ctx.accounts.global_state.fee_num = DEFAULT_FEE_NUMERATOR;
        ctx.accounts.global_state.fee_deno = DEFAULT_FEE_DENOMINATOR;
        ctx.accounts.global_state.coll_per_risklv = DEFAULT_RATIOS;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(global_state_nonce: u8, mint_usdx_nonce: u8)]
pub struct CreateGlobalState<'info> {
    #[account(
        mut,
        // this is for LOCALNET and DEVNET. Please change key for mainnet
        constraint = authority.as_ref().key().to_string() == "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi"
    )]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        seeds = [GLOBAL_STATE_SEED],
        bump,
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        init,
        payer = authority,
        mint::decimals = USDX_DECIMALS,
        mint::authority = global_state,
        seeds = [MINT_USDX_SEED],
        bump,
    )]
    pub mint_usdx: Account<'info, Mint>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub bump: u8,
    pub authority: Pubkey,
    pub mint_usdx: Pubkey,
    pub mint_usdx_nonce: u8,
    pub tvl_limit: u64,
    pub tvl: u64,
    pub paused: u8,
    pub total_debt: u64,
    pub debt_ceiling: u64,
    pub fee_num: u128,
    pub fee_deno: u128,
    pub coll_per_risklv: [u64; 10],
}
