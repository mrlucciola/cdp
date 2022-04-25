// modules
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, accessor::amount, Mint, Token, TokenAccount, Transfer},
};
// local
use crate::{
    constants::*,
    errors::StablePoolError,
    instructions::calc_token_value,
    states::{GlobalState, Oracle, Pool, UserState, Vault},
    utils::{calc_stable_lp_price, validate_market_accounts},
};

pub fn handle(ctx: Context<WithdrawCollateral>, amt_collat_to_withdraw: u64) -> Result<()> {
    let accts = ctx.accounts;

    // validation of market accounts & oracle accounts
    validate_market_accounts(
        &accts.pool,
        accts.ata_market_a.mint,
        accts.ata_market_b.mint,
        accts.oracle_a.mint,
        accts.oracle_b.mint,
    )?;

    let amount_ata_a = amount(&accts.ata_market_a.to_account_info())?;
    let amount_ata_b = amount(&accts.ata_market_b.to_account_info())?;
    let amount_ata_collat_user = amount(&accts.ata_collat_user.to_account_info())?;
    let amount_ata_collat_vault = amount(&accts.ata_collat_vault.to_account_info())?;
    let amount_ata_miner = amount(&accts.ata_collat_miner.to_account_info())?;

    // the tvl value in usd, estimated at time of withdraw
    let tvl_usd = &accts.global_state.tvl_usd;

    // validation
    require!(
        accts.ata_collat_vault.amount > 0,
        StablePoolError::InvalidTransferAmount,
    );

    // TODO 005: after liquidation engine is built, allow users to withdraw up to their ltv
    require!(
        accts.vault.debt == 0,
        StablePoolError::WithdrawNotAllowedWithDebt,
    );

    // calculate the price of the collateral in usd then add that to the usd
    // calculate the entire pool amount plus the amount to be added, and set that as the new value
    let collat_price = calc_stable_lp_price(
        accts.mint_collat.supply.clone(),
        amount_ata_a,
        accts.oracle_a.price,
        amount_ata_b,
        accts.oracle_b.price,
    )?;

    // calculate the value of the token to be withdrawn
    let amt_to_withdraw_value_usd =
        calc_token_value(amt_collat_to_withdraw, collat_price, DECIMALS_PRICE);

    let vault_seeds: &[&[&[u8]]] = &[&[
        VAULT_SEED.as_ref(),
        &accts.mint_collat.key().to_bytes(),
        &accts.authority.key().to_bytes(),
        &[accts.vault.bump],
    ]];

    let transfer_ctx = CpiContext::new_with_signer(
        accts.token_program.to_account_info(),
        Transfer {
            from: accts.ata_collat_vault.clone().to_account_info(),
            to: accts.ata_collat_user.clone().to_account_info(),
            authority: accts.vault.clone().to_account_info(),
        },
        vault_seeds,
    );

    // TODO: do final sanity check that the math is correct
    // require!(future_total_coll_pool - orig_total_coll_pool == amt_to_withdraw);
    // require!(future_total_coll_global_state - orig_total_coll_global_state == amt_to_withdraw);
    // require!(future_total_coll_vault - orig_total_coll_vault == amt_to_withdraw);

    // send the transfer
    token::transfer(transfer_ctx, amt_collat_to_withdraw)?;

    // update the vault usd NOT collat (its in the miner and vault A.T.A.s)
    accts.user_state.tvl_collat_usd = accts
        .vault
        .deposited_collat_usd
        .checked_add(amt_to_withdraw_value_usd)
        .unwrap();
    // vault A.T.A. already has the amount property, so we skip that
    // get the amount held by the vault + miner
    let vault_tvl_collat = amount_ata_miner
        .checked_add(amount_ata_collat_vault)
        .unwrap();
    let vault_tvl_usd = calc_token_value(vault_tvl_collat, collat_price, DECIMALS_PRICE);
    accts.vault.deposited_collat_usd = vault_tvl_usd
        .checked_sub(amt_to_withdraw_value_usd)
        .unwrap();
    // update the pool usd and collat
    let new_pool_token_amt = accts
        .pool
        .total_coll
        .checked_sub(amt_collat_to_withdraw)
        .unwrap();
    accts.pool.total_coll = new_pool_token_amt;
    let new_pool_token_value_usd =
        calc_token_value(new_pool_token_amt, collat_price, DECIMALS_PRICE);
    accts.pool.tvl_usd = new_pool_token_value_usd;

    // update the global state usd and collat
    // // TODO 017: create array mapping for all collat types and their balances in the global state
    // accts.global_state.tvl_collat[token_idx] = accts
    //     .global_state
    //     .tvl_collat[token_idx]
    //     .checked_sub(amt_collat_to_withdraw)
    //     .unwrap();
    // // TODO 017: create array mapping for all collat types and their balances in the global state
    // accts.global_state.tvl_usd[token_idx] = accts
    //     .global_state
    //     .tvl_collat[token_idx]
    //     .checked_sub(amt_collat_to_withdraw)
    //     .unwrap();
    // TODO 018: dont sub usd - look at 017
    accts.global_state.tvl_usd = accts
        .global_state
        .tvl_usd
        .checked_sub(amt_to_withdraw_value_usd)
        .unwrap();
    // accts.vault.deposited_collat_usd = accts
    //     .vault
    //     .deposited_collat_usd
    //     .checked_sub(withdraw_amount)
    //     .unwrap();

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
    #[account[mut]]
    pub authority: Signer<'info>,

    #[account[mut]]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds=[POOL_SEED.as_ref(), pool.mint_collat.as_ref()],
        bump=pool.bump,
        constraint = pool.mint_collat.as_ref() == vault.mint_collat.as_ref(),
    )]
    pub pool: Box<Account<'info, Pool>>,

    // TODO 022: add in client
    // TODO 023: add in frontend
    #[account[mut, seeds = [USER_STATE_SEED.as_ref(), authority.key().as_ref()], bump = user_state.bump]]
    pub user_state: Box<Account<'info, UserState>>,

    #[account(
        mut,
        seeds = [
            VAULT_SEED.as_ref(),
            mint_collat.key().as_ref(),
            authority.key().as_ref(),
        ],
        bump = vault.bump
    )]
    pub vault: Box<Account<'info, Vault>>,

    // TODO 019: rename in client
    // TODO 020: rename in frontend
    #[account(
        mut,
        associated_token::mint = mint_collat.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_collat_user: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint_collat.as_ref(),
        associated_token::authority = vault.as_ref(),
    )]
    pub ata_collat_vault: Box<Account<'info, TokenAccount>>,

    // TODO: add and get miner a.t.a. info from vault
    // #[account(
    //     address = vault.ata_collat_miner
    // )]
    pub ata_collat_miner: Box<Account<'info, TokenAccount>>,

    // TODO 019: rename in client
    // TODO 020: rename in frontend
    // TODO 024: add field to oracle state and constraint here
    /// the A.T.A. of the market, used to get the balance of tokens for price calc
    pub ata_market_a: Box<Account<'info, TokenAccount>>,

    // TODO 019: rename in client
    // TODO 020: rename in frontend
    // TODO 024: add field to oracle state and constraint here
    /// the A.T.A. of the market, used to get the balance of tokens for price calc
    pub ata_market_b: Box<Account<'info, TokenAccount>>,

    // TODO 022: add in client
    // TODO 023: add in frontend
    // TODO 021: add check for correct oracle

    // TODO 022: add in client
    // TODO 023: add in frontend
    // TODO 025: remove, add in the params
    // #[account(constraint = oracle_a.mint.as_ref() == mint_mkt_a.key().as_ref())]
    #[account(address = pool.mint_token_a)]
    pub mint_mkt_a: Box<Account<'info, Mint>>,

    // TODO 022: add in client
    // TODO 023: add in frontend
    // TODO 025: remove, add in the params
    #[account(address = pool.mint_token_b)]
    pub mint_mkt_b: Box<Account<'info, Mint>>,

    // TODO 019: rename in client
    // TODO 020: rename in frontend
    // #[account(constraint = mint_collat.key().as_ref() == pool.mint_collat.as_ref())]
    #[account(address = pool.mint_collat)]
    pub mint_collat: Box<Account<'info, Mint>>,

    #[account(
        seeds = [ORACLE_SEED.as_ref(), mint_mkt_a.key().as_ref()],
        bump = oracle_a.bump,
    )]
    pub oracle_a: Box<Account<'info, Oracle>>,
    // TODO 019: rename in client
    // TODO 020: rename in frontend
    // TODO 021: add check for correct oracle
    #[account(
        seeds = [ORACLE_SEED.as_ref(), mint_mkt_b.key().as_ref()],
        bump = oracle_b.bump,
    )]
    pub oracle_b: Box<Account<'info, Oracle>>,

    // system accounts
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
}
