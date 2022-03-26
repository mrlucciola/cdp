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
    // TODO: rename trove -> vault
    // TODO: rename vault -> pool
    states::{global_state::GlobalState, Oracle, Trove, Vault},
    utils::calc_lp_price,
};

// borrow_amount is in 10 ** DECIMALS_USDX
pub fn handle(ctx: Context<BorrowUsdx>, usdx_borrow_amt_requested: u64) -> Result<()> {
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
    // calculate the future total_debt values for global state, vault, and user
    //   immediately after successful borrow
    let future_total_debt_global_state =
        ctx.accounts.global_state.total_debt + usdx_borrow_amt_requested;
    // TODO: rename vault -> pool
    let future_total_debt_vault = ctx.accounts.vault.total_debt + usdx_borrow_amt_requested;

    // TODO: implement user state
    msg!("THIS IS INCORRECT - PLACEHOLDER - USE THE USERSTATE ACCOUNT TOTAL_DEBT VALUE");
    // let future_total_debt_user = ctx.accounts.user_state.total_debt + usdx_borrow_amt_requested;
    let future_total_debt_user = ctx.accounts.ata_usdx.amount + usdx_borrow_amt_requested;

    // the future debt has to be less than the ceilings
    require!(
        future_total_debt_global_state < ctx.accounts.global_state.global_debt_ceiling,
        StablePoolError::GlobalDebtCeilingExceeded,
    );

    require!(
        // TODO: rename vault -> pool
        future_total_debt_vault < ctx.accounts.vault.debt_ceiling,
        // TODO: rename vault -> pool
        StablePoolError::VaultDebtCeilingExceeded,
    );
    require!(
        future_total_debt_user < ctx.accounts.global_state.user_debt_ceiling,
        StablePoolError::UserDebtCeilingExceeded,
    );

    // user can only borrow up to the max LTV for this collateral
    // TODO: you can only borrow up to the max of a single trove in a single transaction
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
/// This will change to: query balance in Trove (to be named to Vault)
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
    pub global_state: Account<'info, GlobalState>,
    pub oracle_a: Account<'info, Oracle>,
    pub oracle_b: Account<'info, Oracle>,
    pub ata_market_a: Box<Account<'info, TokenAccount>>,
    pub ata_market_b: Box<Account<'info, TokenAccount>>,
    pub mint_coll: Box<Account<'info, Mint>>,
    #[account(
        mut,
        // TODO: rename vault -> pool
        seeds=[VAULT_SEED.as_ref(), vault.mint.as_ref()],
        // TODO: rename vault -> pool
        bump=vault.bump,
        constraint = vault.mint.as_ref() == trove.mint.as_ref(),// TODO: rename trove -> vault
    )]
    pub vault: Box<Account<'info, Vault>>, // TODO: rename vault -> pool
    #[account(
        mut,
        seeds=[
            TROVE_SEED.as_ref(),// TODO: rename trove -> vault
            trove.mint.as_ref(),// TODO: rename trove -> vault
            authority.key().as_ref(),
        ],
        bump=trove.bump,// TODO: rename trove -> vault
        constraint = vault.mint.as_ref() == trove.mint.as_ref(),// TODO: rename trove -> vault
    )]
    pub trove: Box<Account<'info, Trove>>, // TODO: rename trove -> vault
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
