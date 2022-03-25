// libraries
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, accessor::amount, Mint, Token, TokenAccount},
};
// local
use crate::{
    constants::*,
    states::{global_state::GlobalState, Oracle, Trove, Vault}, // TODO: rename trove -> vault
    utils::calc_lp_price,
};

// BorrowUsdx
pub fn handle(ctx: Context<BorrowUsdx>, borrow_amount: u64) -> Result<()> {
    let oracle_a = ctx.accounts.oracle_a.clone();
    let oracle_b = ctx.accounts.oracle_b.clone();
    let amount_ata_a = amount(&ctx.accounts.ata_market_a.to_account_info())?;
    let amount_ata_b = amount(&ctx.accounts.ata_market_b.to_account_info())?;
    msg!("oracle a price: {}", &oracle_a.price);
    msg!("oracle b price: {}", &oracle_b.price);
    msg!("lp mint supply: {}", &ctx.accounts.mint_coll.supply);
    msg!("token amount a: {}", &amount_ata_a);
    msg!("token amount b: {}", &amount_ata_b);
    let collat_price = calc_lp_price(
        ctx.accounts.mint_coll.supply,
        amount_ata_a,
        ctx.accounts.vault.token_a_decimals,
        oracle_a.price,
        amount_ata_b,
        ctx.accounts.vault.token_b_decimals,
        oracle_b.price,
    )?;

    msg!("Collateral value here: {:?}", collat_price);

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
        seeds=[VAULT_SEED.as_ref(), vault.mint.as_ref()],
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
        seeds=[MINT_USDX_SEED],
        bump,
        constraint=mint_usdx.key() == global_state.mint_usdx,
    )]
    pub mint_usdx: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer=authority,
        associated_token::mint = mint_usdx.as_ref(),
        associated_token::authority = authority.as_ref(),
    )]
    pub ata_usdx: Box<Account<'info, TokenAccount>>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
