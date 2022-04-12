// modules
use anchor_lang::prelude::*;
use anchor_spl::associated_token::{self, AssociatedToken};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
// local
use crate::{
    constants::*,
    states::{GlobalState, Pool, Vault},
};

pub fn handle(ctx: Context<HarvestRewardsFromSaber>) -> Result<()> {
    let accts = ctx.accounts;

    let fee_amount = (accts.ata_reward_vault.amount as u128)
        .checked_mul(accts.global_state.fee_num as u128)
        .unwrap()
        .checked_div(accts.global_state.fee_deno as u128)
        .unwrap() as u64;
    let user_amount = accts
        .ata_reward_vault
        .amount
        .checked_sub(fee_amount)
        .unwrap();

    let vault_seeds: &[&[&[u8]]] = &[&[
        VAULT_SEED.as_ref(),
        &accts.pool.mint_collat.to_bytes(),
        &accts.authority.key().to_bytes(),
        &[accts.vault.bump],
    ]];
    let transfer_cts = CpiContext::new(
        self.token_program.to_account_info(),
        Transfer {
            from: self.ata_reward_vault.to_account_info(),
            to: self.ata_reward_user.to_account_info(),
            authority: self.vault.to_account_info(),
        },
    );

    token::transfer(
        accts.transfer_to_user_context().with_signer(vault_seeds),
        user_amount,
    )?;

    token::transfer(
        accts.transfer_fee_context().with_signer(vault_seeds),
        fee_amount,
    )?;
    Ok(())
}

impl<'info> HarvestRewardsFromSaber<'info> {
    fn transfer_fee_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.ata_reward_vault.to_account_info(),
                to: self.ata_cdp_treasury.to_account_info(),
                authority: self.vault.to_account_info(),
            },
        )
    }
}

#[derive(Accounts)]
pub struct HarvestRewardsFromSaber<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

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
            pool.mint_collat.as_ref(),
            authority.key().as_ref(),
        ],
        bump=vault.bump
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        associated_token::mint = mint_reward,
        associated_token::authority = authority,
    )]
    pub ata_reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        associated_token::mint = mint_reward,
        associated_token::authority = authority,
    )]
    pub ata_reward_user: Box<Account<'info, TokenAccount>>,

    #[account(
        associated_token::mint = mint_reward,
        associated_token::authority = treasury,
    )]
    pub ata_cdp_treasury: Box<Account<'info, TokenAccount>>,

    #[account(mut, address = global_state.treasury)]
    /// CHECK: address is checked
    pub treasury: AccountInfo<'info>,

    #[account(mut, address = pool.mint_reward)]
    pub mint_reward: Box<Account<'info, Mint>>,

    // system accounts
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
