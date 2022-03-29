// libraries
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{accessor::amount, mint_to, Mint, MintTo, Token, TokenAccount},
};
// local
use crate::{
    constants::*,
    errors::StablePoolError,
    states::{global_state::GlobalState, Oracle, Pool, Vault},
    utils::{calc_lp_price, validate_market_accounts},
};

// borrow_amount is in 10 ** DECIMALS_USDX
pub fn handle(ctx: Context<BorrowUsdx>, usdx_borrow_amt_requested: u64) -> Result<()> {
    // validation of market accounts & oracle accounts
    validate_market_accounts(
        &ctx.accounts.pool,
        ctx.accounts.ata_market_a.mint,
        ctx.accounts.ata_market_b.mint,
        ctx.accounts.oracle_a.mint,
        ctx.accounts.oracle_b.mint,
    )?;

    let amount_ata_a = amount(&ctx.accounts.ata_market_a.to_account_info())?;
    let amount_ata_b = amount(&ctx.accounts.ata_market_b.to_account_info())?;

    // This price is not in human format, its multiplied by decimal amount
    let collat_price = calc_lp_price(
        ctx.accounts.mint_coll.supply.clone(),
        amount_ata_a,
        ctx.accounts.oracle_a.price,
        amount_ata_b,
        ctx.accounts.oracle_b.price,
    )?;

    let user_collat_amt = ctx.accounts.ata_coll.amount;
    let collat_value = collat_price
        .checked_mul(user_collat_amt)
        .unwrap()
        .checked_div(10u64.checked_pow(DECIMALS_PRICE as u32).unwrap())
        .unwrap();

    // assertions
    // calculate the future total_debt values for global state, pool, and user
    //   immediately after successful borrow
    let future_total_debt_global_state = ctx
        .accounts
        .global_state
        .total_debt
        .checked_add(usdx_borrow_amt_requested)
        .unwrap();

    let future_total_debt_pool = ctx
        .accounts
        .pool
        .total_debt
        .checked_add(usdx_borrow_amt_requested)
        .unwrap();

    // TODO: implement user state
    msg!("THIS IS INCORRECT - PLACEHOLDER - USE THE USERSTATE ACCOUNT TOTAL_DEBT VALUE");
    // let future_total_debt_user = ctx.accounts.user_state.total_debt + usdx_borrow_amt_requested;
    let future_total_debt_user = ctx
        .accounts
        .ata_usdx
        .amount
        .checked_add(usdx_borrow_amt_requested)
        .unwrap();

    // the future debt has to be less than the ceilings
    require!(
        future_total_debt_global_state < ctx.accounts.global_state.global_debt_ceiling,
        StablePoolError::GlobalDebtCeilingExceeded,
    );

    require!(
        future_total_debt_pool < ctx.accounts.pool.debt_ceiling,
        StablePoolError::PoolDebtCeilingExceeded,
    );
    require!(
        future_total_debt_user < ctx.accounts.global_state.user_debt_ceiling,
        StablePoolError::UserDebtCeilingExceeded,
    );

    // user can only borrow up to the max LTV for this collateral
    // TODO: you can only borrow up to the max of a single vault in a single transaction
    // this measn that in order to borrow from collateral across multiple collateral types,
    // you have to submit one txn per collateral type
    let ltv = *DEFAULT_RATIOS.get(0).unwrap_or(&0) as u128; // risk_level
    let ltv_max = ltv
        .checked_mul(collat_value as u128)
        .unwrap()
        .checked_div(10_u128.checked_pow(DEFAULT_RATIOS_DECIMALS as u32).unwrap())
        .unwrap();
    msg!("ltv      : {}", ltv);
    msg!("ltv_max  : {}", ltv_max);
    require!(
        usdx_borrow_amt_requested < (ltv_max as u64),
        StablePoolError::LTVExceeded
    );

    // mint - the global state is the authority for USDx minting
    let global_state_seed: &[&[&[u8]]] =
        &[&[&GLOBAL_STATE_SEED, &[ctx.accounts.global_state.bump]]];
    let mint_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint_usdx.to_account_info(),
            to: ctx.accounts.ata_usdx.to_account_info(),
            authority: ctx.accounts.global_state.to_account_info(),
        },
        global_state_seed,
    );

    // mint
    mint_to(mint_ctx, usdx_borrow_amt_requested)?;

    Ok(())
}

/// Borrowing usdx is based on the sum of all borrowed amounts from all troves
/// This is still in progress. In this iteration, we are just setting the
/// LP price to 1 LP = 0.5USDC + 0.5USDT = 1USD ~= 1USDx
///
/// This will change to: query balance in Vault
/// THIS IS NOT COMPLETE
#[derive(Accounts)]
pub struct BorrowUsdx<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED.as_ref()],
        bump = global_state.bump
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
    pub oracle_a: Box<Account<'info, Oracle>>,
    pub oracle_b: Box<Account<'info, Oracle>>,
    pub ata_market_a: Box<Account<'info, TokenAccount>>,
    pub ata_market_b: Box<Account<'info, TokenAccount>>,
    pub mint_coll: Box<Account<'info, Mint>>,
    #[account(
        mut,
        seeds=[POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump=pool.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint.as_ref(),
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
        constraint = pool.mint_collat.as_ref() == vault.mint.as_ref(),
    )]
    pub vault: Box<Account<'info, Vault>>,
    #[account(
        mut,
        seeds=[MINT_USDX_SEED.as_ref()],
        bump=global_state.mint_usdx_bump,
        constraint=mint_usdx.key() == global_state.mint_usdx,
    )]
    pub mint_usdx: Box<Account<'info, Mint>>,
    #[account(
        // TODO: don't init here, create ata outside the contract
        init_if_needed,
        payer=authority,
        associated_token::mint = mint_usdx.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_usdx: Box<Account<'info, TokenAccount>>,
    pub ata_coll: Box<Account<'info, TokenAccount>>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
