// libraries
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, accessor::amount, mint_to, Mint, MintTo, Token, TokenAccount},
};
// local
use crate::{
    constants::*,
    errors::StablePoolError,
    states::{global_state::GlobalState, Oracle, Pool, UserState, Vault},
    utils::{calc_stable_lp_price, validate_market_accounts},
};

pub fn calc_stable_lp_value(
    lp_amt: u64,
    ata_mkt_a: &AccountInfo,
    ata_mkt_b: &AccountInfo,
    mint_collat_supply: u64,
    oracle_a_price: u64,
    oracle_b_price: u64,
) -> Result<u64> {
    let amount_ata_a = amount(ata_mkt_a)?;
    let amount_ata_b = amount(ata_mkt_b)?;

    let collat_price = calc_stable_lp_price(
        mint_collat_supply,
        amount_ata_a,
        oracle_a_price,
        amount_ata_b,
        oracle_b_price,
    )?;

    let lp_value = collat_price
        .checked_mul(lp_amt)
        .unwrap()
        .checked_div(10u64.checked_pow(DECIMALS_PRICE as u32).unwrap())
        .unwrap();

    Ok(lp_value)
}

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

    let user_collat_amt = ctx
        .accounts
        .ata_collat_vault
        .amount
        .checked_add(ctx.accounts.ata_collat_miner.amount)
        .unwrap();

    let user_collat_value = calc_stable_lp_value(
        user_collat_amt,
        &ctx.accounts.ata_market_a.to_account_info(),
        &ctx.accounts.ata_market_b.to_account_info(),
        ctx.accounts.mint_collat.supply,
        ctx.accounts.oracle_a.price,
        ctx.accounts.oracle_b.price,
    )?;
    msg!("user_collat_amt: {}", user_collat_amt);
    msg!("amt requested: {}", usdx_borrow_amt_requested);
    msg!(
        "limit global : {}",
        ctx.accounts.global_state.tvl_collat_ceiling_usd
    );
    msg!("limit pool   : {}", ctx.accounts.pool.debt_ceiling);
    msg!(
        "limit user   : {}",
        ctx.accounts.global_state.debt_ceiling_user
    );
    // msg!("limit user   : {}", ctx.accounts.user.debt_ceiling);

    // This price is not in human format, its multiplied by decimal amount
    // let collat_price = calc_stable_lp_price(
    //     ctx.accounts.mint_collat.supply.clone(),
    //     amount_ata_a,
    //     ctx.accounts.oracle_a.price,
    //     amount_ata_b,
    //     ctx.accounts.oracle_b.price,
    // )?;

    // assertions
    // calculate the future total_debt values for global state, pool, and user
    //   immediately after successful borrow
    let future_total_debt_global_state = ctx
        .accounts
        .global_state
        .total_debt_usdx
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
        .vault
        .debt
        .checked_add(usdx_borrow_amt_requested)
        .unwrap();

    // the future debt has to be less than the ceilings
    require!(
        future_total_debt_global_state < ctx.accounts.global_state.debt_ceiling_global,
        StablePoolError::GlobalDebtCeilingExceeded,
    );

    require!(
        future_total_debt_pool < ctx.accounts.pool.debt_ceiling,
        StablePoolError::PoolDebtCeilingExceeded,
    );
    require!(
        future_total_debt_user < ctx.accounts.global_state.debt_ceiling_user,
        StablePoolError::UserDebtCeilingExceeded,
    );

    // user can only borrow up to the max LTV for this collateral
    // TODO: you can only borrow up to the max of a single vault in a single transaction
    // this measn that in order to borrow from collateral across multiple collateral types,
    // you have to submit one txn per collateral type
    let ltv = *DEFAULT_RATIOS.get(0).unwrap_or(&0) as u128; // risk_level

    // ltv_max should be formed as USDx amount
    // user_collat_value is divided by 10^collateral_decimal
    let ltv_max = ltv
        .checked_mul(user_collat_value as u128)
        .unwrap()
        .checked_div(10_u128.checked_pow(DEFAULT_RATIOS_DECIMALS as u32).unwrap())
        .unwrap()
        .checked_mul(10_u128.checked_pow(DECIMALS_USDX as u32).unwrap())
        .unwrap()
        .checked_div(
            10_u128
                .checked_pow(ctx.accounts.mint_collat.decimals as u32)
                .unwrap(),
        )
        .unwrap();

    let mintable_amount = (ltv_max as u64)
        .checked_sub(ctx.accounts.vault.debt)
        .unwrap();

    msg!("user_collat_value: {}", user_collat_value);
    msg!("ltv: {}", ltv);
    msg!("ltv_max: {}", ltv_max);
    msg!("ctx.accounts.vault.debt: {}", ctx.accounts.vault.debt);
    msg!("mintable: {}", mintable_amount);
    require!(
        usdx_borrow_amt_requested < mintable_amount,
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

    ctx.accounts.global_state.total_debt_usdx = ctx
        .accounts
        .global_state
        .total_debt_usdx
        .checked_add(usdx_borrow_amt_requested)
        .unwrap();

    ctx.accounts.pool.total_debt = ctx
        .accounts
        .pool
        .total_debt
        .checked_add(usdx_borrow_amt_requested)
        .unwrap();

    ctx.accounts.vault.debt = ctx
        .accounts
        .vault
        .debt
        .checked_add(usdx_borrow_amt_requested)
        .unwrap();

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
        constraint = pool.mint_collat.as_ref() == vault.mint_collat.as_ref(),
    )]
    pub pool: Box<Account<'info, Pool>>,

    // user-authored CDP accounts
    #[account(
        mut,
        seeds = [
            VAULT_SEED.as_ref(),
            vault.mint_collat.as_ref(),
            authority.key().as_ref(),
        ],
        bump = vault.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint_collat.as_ref(),
    )]
    pub vault: Box<Account<'info, Vault>>,
    #[account[mut, seeds = [USER_STATE_SEED.as_ref(), authority.key().as_ref()], bump = user_state.bump]]
    pub user_state: Box<Account<'info, UserState>>,
    // Quarry-specific accounts
    // A.T.A.s
    #[account(
        mut,
        associated_token::mint = mint_usdx.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_usdx: Box<Account<'info, TokenAccount>>,
    #[account(
        associated_token::mint = mint_collat.as_ref(),
        associated_token::authority = vault.as_ref(),
    )]
    pub ata_collat_vault: Box<Account<'info, TokenAccount>>,
    #[account(address = vault.ata_collat_miner)]
    pub ata_collat_miner: Box<Account<'info, TokenAccount>>,
    pub ata_market_a: Box<Account<'info, TokenAccount>>,
    pub ata_market_b: Box<Account<'info, TokenAccount>>,
    // Mint accounts
    #[account(address = pool.mint_collat)]
    pub mint_collat: Box<Account<'info, Mint>>,
    #[account(
        mut,
        seeds = [MINT_USDX_SEED.as_ref()],
        bump = global_state.mint_usdx_bump,
        constraint = mint_usdx.key() == global_state.mint_usdx,
    )]
    pub mint_usdx: Box<Account<'info, Mint>>,
    // Other accounts
    #[account(
        seeds = [ORACLE_SEED.as_ref(), pool.mint_token_a.as_ref()],
        bump = oracle_a.bump,
    )]
    pub oracle_a: Box<Account<'info, Oracle>>,
    #[account(
        seeds = [ORACLE_SEED.as_ref(), pool.mint_token_b.as_ref()],
        bump = oracle_b.bump,
    )]
    pub oracle_b: Box<Account<'info, Oracle>>,
    // system accounts
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
}
