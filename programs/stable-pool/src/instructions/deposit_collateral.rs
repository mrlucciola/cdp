// modules
use crate::states::Oracle;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, accessor::amount, Mint, Token, TokenAccount, Transfer};
// local
use crate::{
    constants::*,
    errors::StablePoolError,
    states::{GlobalState, Pool, Vault},
    utils::calc_lp_price,
};

pub fn handle(ctx: Context<DepositCollateral>, collat_token_deposit_amt: u64) -> Result<()> {
    let accts = ctx.accounts;
    let amount_ata_a = amount(&accts.ata_market_a.to_account_info())?;
    let amount_ata_b = amount(&accts.ata_market_b.to_account_info())?;
    // validation
    // the tvl value in usd, estimated at time of deposit
    let tvl_usd = &accts.global_state.tvl_usd;

    // user amount in the ata has to be greater than 0
    require!(
        accts.ata_user.amount > 0,
        StablePoolError::InvalidTransferAmount,
    );
    require!(
        accts.ata_user.amount > collat_token_deposit_amt,
        StablePoolError::InvalidTransferAmount,
    );

    // calculate the price of the collateral in usd then add that to the usd
    // calculate the entire pool amount plus the amount to be added, and set that as the new value
    let collat_price = calc_lp_price(
        accts.mint_collat.supply.clone(),
        amount_ata_a,
        accts.oracle_a.price,
        amount_ata_b,
        accts.oracle_b.price,
    )?;

    // the token amount across all user accounts that deposited this collateral
    let orig_pool_token_amt = accts.pool.total_coll;
    // calculate pool_tvl_usd
    let orig_pool_token_value_usd = collat_price
        .checked_mul(orig_pool_token_amt)
        .unwrap()
        .checked_div(10u64.checked_pow(DECIMALS_PRICE as u32).unwrap())
        .unwrap();

    // calculate the value of the token to be deposited
    let deposit_token_value_usd = (collat_price as u128)
        .checked_mul(collat_token_deposit_amt as u128)
        .unwrap() // handle this properly
        .checked_div(10u64.checked_pow(DECIMALS_PRICE as u32).unwrap() as u128)
        .unwrap();

    // TODO: rename tvl_limit -> tvl_ceiling_usd
    let global_tvl_ceiling_usd = accts.global_state.tvl_limit as u128;

    // global tvl limit has to be less than the next tvl if deposit were to go thru
    require!(
        (*tvl_usd as u128) + (collat_token_deposit_amt as u128) <= global_tvl_ceiling_usd,
        StablePoolError::GlobalTVLExceeded
    );
    // send the transfer
    let transfer_ctx = CpiContext::new(
        accts.token_program.to_account_info(),
        Transfer {
            from: accts.ata_user.clone().to_account_info(),
            to: accts.ata_vault.clone().to_account_info(),
            authority: accts.authority.clone().to_account_info(),
        },
    );
    token::transfer(transfer_ctx, collat_token_deposit_amt)?;

    // add the tokens to the pool and vault
    accts.pool.total_coll += collat_token_deposit_amt;
    accts.vault.locked_coll_balance += collat_token_deposit_amt;

    // the usd value of all user deposited collateral for this collateral type
    let new_pool_tvl_usd = (orig_pool_token_value_usd as u128) + deposit_token_value_usd;
    // update the global state
    accts.global_state.tvl_usd = new_pool_tvl_usd as u64;

    Ok(())
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account[mut]]
    pub authority: Signer<'info>,
    #[account[mut]]
    pub global_state: Account<'info, GlobalState>,

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
    pub ata_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_collat.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_user: Account<'info, TokenAccount>,

    #[account(constraint = mint_collat.key().as_ref() == pool.mint_collat.as_ref())]
    pub mint_collat: Box<Account<'info, Mint>>,

    pub oracle_a: Account<'info, Oracle>,
    pub oracle_b: Account<'info, Oracle>,
    pub ata_market_a: Box<Account<'info, TokenAccount>>,
    pub ata_market_b: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
