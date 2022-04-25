// modules
use crate::states::{Oracle, UserState};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, accessor::amount, Mint, Token, TokenAccount, Transfer},
};
// local
use crate::{
    constants::*,
    errors::StablePoolError,
    states::{GlobalState, Pool, Vault},
    utils::{calc_stable_lp_price, validate_market_accounts},
};

pub fn calc_token_value(token_amount: u64, token_price: u64, token_price_decimals: u64) -> u64 {
    // msg!(
    //     "token amt: {}    token_price: {}    token_price_decimals: {}",
    //     token_amount,
    //     token_price,
    //     token_price_decimals
    // );
    (token_price as u128)
        .checked_mul(token_amount as u128)
        .unwrap()
        .checked_div(10u128.checked_pow(token_price_decimals as u32).unwrap())
        .unwrap() as u64
}

/**
 * User A.T.A. is debited collateral token
 * Vault A.T.A. is credited collateral token
 */
pub fn handle(ctx: Context<DepositCollateral>, amt_collat_to_deposit: u64) -> Result<()> {
    let accts = ctx.accounts;

    // validation of market accounts & oracle accounts
    validate_market_accounts(
        &accts.pool,
        accts.ata_market_a.mint,
        accts.ata_market_b.mint,
        accts.oracle_a.mint,
        accts.oracle_b.mint,
    )?;

    let amt_ata_mkt_a = accts.ata_market_a.amount;
    let amt_ata_mkt_b = accts.ata_market_b.amount;
    let amt_ata_collat_user = accts.ata_collat_user.amount;
    let amt_ata_collat_vault = accts.ata_collat_vault.amount;
    let amt_ata_collat_miner = accts.ata_collat_miner.amount;

    let amount_ata_a = amount(&accts.ata_market_a.to_account_info())?;
    let amount_ata_b = amount(&accts.ata_market_b.to_account_info())?;
    // TODO: evaluate if we can delete amount_ata_collat_user
    // let amount_ata_collat_user = amount(&accts.ata_collat_user.to_account_info())?;
    let amount_ata_collat_vault = amount(&accts.ata_collat_vault.to_account_info())?;
    let amount_ata_miner = amount(&accts.ata_collat_miner.to_account_info())?;

    ////////////////////////////////////
    //////////// validation ////////////

    // the tvl value in usd, estimated at time of deposit
    let global_tvl_usd = &accts.global_state.tvl_usd;

    // user amount in the ata has to be greater than 0
    require!(
        amt_ata_collat_user > 0,
        StablePoolError::InvalidTransferAmount,
    );
    // user amount in the ata has to be greater than amount being deposited
    require!(
        amt_ata_collat_user >= amt_collat_to_deposit,
        StablePoolError::InvalidTransferAmount,
    );

    // calculate the price of the collateral in usd then add that to the usd
    // calculate the entire pool amount plus the amount to be added, and set that as the new value
    let collat_price = calc_stable_lp_price(
        accts.mint_collat.supply.clone(),
        amt_ata_mkt_a,
        accts.oracle_a.price,
        amt_ata_mkt_b,
        accts.oracle_b.price,
    )?;

    // calculate the value of the token to be deposited
    let amt_to_deposit_value_usd =
        calc_token_value(amt_collat_to_deposit, collat_price, DECIMALS_PRICE);

    // global tvl limit has to be less than the next tvl if deposit were to go thru
    require!(
        *global_tvl_usd + amt_to_deposit_value_usd <= accts.global_state.tvl_collat_ceiling_usd,
        StablePoolError::GlobalTVLExceeded
    );
    // send the transfer
    let transfer_ctx = CpiContext::new(
        accts.token_program.to_account_info(),
        Transfer {
            from: accts.ata_collat_user.clone().to_account_info(),
            to: accts.ata_collat_vault.clone().to_account_info(),
            authority: accts.authority.clone().to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amt_collat_to_deposit)?;

    // add the A.T.A.'s collat token balance in USD value to the pool
    // accts.user_state.deposited_collat_usd = accts
    //     .user_state
    //     .deposited_collat_usd
    //     .checked_add(amt_to_deposit_value_usd)
    //     .unwrap();
    accts.user_state.tvl_collat_usd = accts
        .user_state
        .tvl_collat_usd
        .checked_add(amt_collat_to_deposit)
        .unwrap();

    // vault A.T.A. already has the amount property, so we skip that
    let vault_tvl_collat = amt_ata_collat_miner
        .checked_add(amt_ata_collat_vault)
        .unwrap();
    let vault_tvl_usd = calc_token_value(vault_tvl_collat, collat_price, DECIMALS_PRICE);
    accts.vault.deposited_collat_usd = vault_tvl_usd.checked_add(amt_to_deposit_value_usd).unwrap();

    // the token amount across all user accounts that deposited this collateral
    let new_pool_token_amt = accts
        .pool
        .total_coll
        .checked_add(amt_collat_to_deposit)
        .unwrap();
    // add the A.T.A.'s collat token balance (not USD value) to the pool
    accts.pool.total_coll = new_pool_token_amt;
    let new_pool_token_value_usd =
        calc_token_value(new_pool_token_amt, collat_price, DECIMALS_PRICE);
    // the usd value of all user deposited collateral for this collateral type
    // update the global state
    accts.pool.tvl_usd = new_pool_token_value_usd;

    // // TODO 017: create array mapping for all collat types and their balances in the global state
    // accts.global_state.tvl_collat[token_idx] = accts
    //     .global_state
    //     .tvl_collat[token_idx]
    //     .checked_add(amt_collat_to_deposit)
    //     .unwrap();
    // calculate pool_tvl_usd

    // TODO 018: dont sum usd - look at 017. would prefer to do this calc without a crank, but might need to sum all pool usd values together
    accts.global_state.tvl_usd = accts
        .global_state
        .tvl_usd
        .checked_add(amt_to_deposit_value_usd)
        .unwrap();

    Ok(())
}

// rename to DepositCollateralToVault
#[derive(Accounts)]
pub struct DepositCollateral<'info> {
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

    #[account[mut, seeds = [USER_STATE_SEED.as_ref(), authority.key().as_ref()], bump = user_state.bump]]
    pub user_state: Box<Account<'info, UserState>>,

    #[account(
        mut,
        seeds=[
            VAULT_SEED.as_ref(),
            mint_collat.key().as_ref(),
            authority.key().as_ref(),
        ],
        bump=vault.bump
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        associated_token::mint = mint_collat.as_ref(),
        associated_token::authority = vault.as_ref(),
    )]
    pub ata_collat_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint_collat.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_collat_user: Box<Account<'info, TokenAccount>>,

    // TODO: Find the authority, and/or seeds to safely pass this account in
    // #[account(
    //     associated_token::mint = mint_collat.as_ref(),
    //     associated_token::authority = miner.as_ref(),
    // )]
    pub ata_collat_miner: Box<Account<'info, TokenAccount>>,

    /// Mint account for collateral token
    #[account(address = pool.mint_collat)]
    pub mint_collat: Box<Account<'info, Mint>>,

    #[account(
        seeds = [ORACLE_SEED.as_ref(), oracle_a.mint.as_ref()],
        bump = oracle_a.bump,
    )]
    pub oracle_a: Box<Account<'info, Oracle>>,
    #[account(
        seeds = [ORACLE_SEED.as_ref(), oracle_b.mint.as_ref()],
        bump = oracle_b.bump,
    )]
    pub oracle_b: Box<Account<'info, Oracle>>,
    pub ata_market_a: Box<Account<'info, TokenAccount>>,
    pub ata_market_b: Box<Account<'info, TokenAccount>>,

    // system accounts
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
}
