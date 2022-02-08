use anchor_lang::{
    prelude::*,
    solana_program::{
        program::{invoke_signed},
        instruction::{AccountMeta, Instruction},
    }
};
use anchor_spl::token::{Token, Mint, TokenAccount};

use crate::{states::*, constant::*};

pub fn process_init_orca_farm(
    ctx: Context<InitRatioUserFarm>,
    ratio_authority_bump: u8
) -> ProgramResult {
    invoke_signed( 
        &Instruction {
            program_id: ctx.accounts.orca_farm_program.key(),
            data: vec![OrcaInstrunction::InitUserFarm as u8],
            accounts: vec![
                // global farm
                AccountMeta::new_readonly(ctx.accounts.global_farm.key(), false),
                // user farm
                AccountMeta::new(ctx.accounts.ratio_user_farm.key(), false),
                // farm owner
                AccountMeta::new(ctx.accounts.ratio_orca_authority.key(), true),
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
            ]
        },
        &[
            ctx.accounts.global_farm.to_account_info().clone(),
            ctx.accounts.ratio_user_farm.to_account_info().clone(),
            ctx.accounts.ratio_orca_authority.to_account_info().clone(),
            ctx.accounts.system_program.to_account_info().clone(),
            ctx.accounts.orca_farm_program.to_account_info().clone()
        ],
        &[&[
            RATIO_ORCA_AUTH_TAG, ctx.accounts.payer.key().as_ref(), &[ratio_authority_bump]
        ]]
    )?;
    Ok(())
}

pub fn process_create_orca_vault(
    ctx: Context<CreateOrcaVault>, 
    is_dd: u8,
    orca_vault_nonce: u8
) -> ProgramResult {
    let orca_vault = &mut ctx.accounts.orca_vault;
    orca_vault.base_mint = ctx.accounts.base_mint.key();
    orca_vault.lp_mint = ctx.accounts.lp_mint.key();
    orca_vault.dd_mint = ctx.accounts.dd_mint.key();
    orca_vault.is_dd = is_dd;
    Ok(())
}

pub fn process_deposit_orcalp(
    ctx: Context<DepositOrcaLP>, 
    amount: u64, 
    ratio_authority_bump : u8,
) -> ProgramResult {
    let mut data: Vec<u8> = vec![];
    data.push(OrcaInstrunction::ConvertTokens as u8);
    data.extend(amount.to_le_bytes().to_vec());
    invoke_signed(
        &Instruction {
            program_id: ctx.accounts.orca_farm_program.key(),
            data,
            accounts: vec![
                // farm owner
                AccountMeta::new(ctx.accounts.ratio_authority.key(), true),
                // base token account
                AccountMeta::new(ctx.accounts.ratio_base_token_account.key(), false),
                // orca base vault
                AccountMeta::new(ctx.accounts.orca_base_vault.key(), false),
                // transfer authority
                AccountMeta::new(ctx.accounts.ratio_authority.key(), true),
                // pool token mint
                AccountMeta::new(ctx.accounts.pool_token_mint.key(), false),
                // pool token account
                AccountMeta::new(ctx.accounts.ratio_pool_token_account.key(), false),
                // global farm
                AccountMeta::new(ctx.accounts.global_farm.key(), false),
                // user farm
                AccountMeta::new(ctx.accounts.ratio_user_farm.key(), false),
                // orca reward vault
                AccountMeta::new(ctx.accounts.orca_reward_vault.key(), false),
                // reward_token_account
                AccountMeta::new(ctx.accounts.ratio_reward_token_account.key(), false),
                // orca farm authority
                AccountMeta::new_readonly(ctx.accounts.authority.key(), false),
                // token program
                AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
            ]
        },
        &[
            ctx.accounts.ratio_authority.to_account_info().clone(),
            ctx.accounts.ratio_base_token_account.to_account_info().clone(),
            ctx.accounts.orca_base_vault.to_account_info().clone(),
            ctx.accounts.ratio_authority.to_account_info().clone(),
            ctx.accounts.pool_token_mint.to_account_info().clone(),
            ctx.accounts.ratio_pool_token_account.to_account_info().clone(),
            ctx.accounts.global_farm.clone(),
            ctx.accounts.ratio_user_farm.clone(),
            ctx.accounts.orca_reward_vault.to_account_info().clone(),
            ctx.accounts.ratio_reward_token_account.to_account_info().clone(),
            ctx.accounts.authority.clone(),
            ctx.accounts.token_program.to_account_info().clone(),
            ctx.accounts.orca_farm_program.to_account_info().clone()
        ],
        &[&[
            RATIO_ORCA_AUTH_TAG, ctx.accounts.owner.key().as_ref(), &[ratio_authority_bump]
        ]]
    )?;


    ctx.accounts.user_trove.locked_coll_balance += amount;
    ctx.accounts.token_vault.total_coll += amount;
    Ok(())
}

pub fn process_withdraw_orcalp(
    ctx: Context<WithdrawOrcaLP>, 
    amount: u64,
    ratio_authority_bump : u8
) -> ProgramResult {
    ///
    /// First, Unstake Ratio's LP tokens to baseToken
    let mut data: Vec<u8> = vec![];
    data.push(OrcaInstrunction::RevertTokens as u8);
    data.extend(amount.to_le_bytes().to_vec());

    invoke_signed(
        &Instruction {
            program_id: ctx.accounts.orca_farm_program.key(),
            data,
            accounts: vec![
                // farm owner
                AccountMeta::new(ctx.accounts.ratio_authority.key(), true),
                // base token account
                AccountMeta::new(ctx.accounts.user_base_token_account.key(), false),
                // orca base vault
                AccountMeta::new(ctx.accounts.orca_base_vault.key(), false),
                // pool token mint
                AccountMeta::new(ctx.accounts.pool_token_mint.key(), false),
                // pool token account
                AccountMeta::new(ctx.accounts.ratio_pool_token_account.key(), false),
                // burn authority
                //AccountMeta::new_readonly(ctx.accounts.owner.key(), true),
                AccountMeta::new(ctx.accounts.ratio_authority.key(), true),
                // global farm
                AccountMeta::new(ctx.accounts.global_farm.key(), false),
                // user farm
                AccountMeta::new(ctx.accounts.ratio_user_farm.key(), false),
                // orca reward vault
                AccountMeta::new(ctx.accounts.orca_reward_vault.key(), false),
                // reward_token_account
                AccountMeta::new(ctx.accounts.user_reward_token_account.key(), false),
                // orca farm authority
                AccountMeta::new_readonly(ctx.accounts.authority.key(), false),
                // token program
                AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
            ]
        },
        &[
            ctx.accounts.ratio_authority.clone(),
            ctx.accounts.user_base_token_account.to_account_info().clone(),
            ctx.accounts.orca_base_vault.to_account_info().clone(),
            ctx.accounts.pool_token_mint.to_account_info().clone(),
            ctx.accounts.ratio_pool_token_account.to_account_info().clone(),
            ctx.accounts.ratio_authority.clone(),
            ctx.accounts.global_farm.clone(),
            ctx.accounts.ratio_user_farm.clone(),
            ctx.accounts.orca_reward_vault.to_account_info().clone(),
            ctx.accounts.user_reward_token_account.to_account_info().clone(),
            ctx.accounts.authority.clone(),
            ctx.accounts.token_program.to_account_info().clone(),
            ctx.accounts.orca_farm_program.to_account_info().clone()
        ],
        &[&[
            RATIO_ORCA_AUTH_TAG, ctx.accounts.owner.key().as_ref(), &[ratio_authority_bump]
        ]]
    )?;
    
    ctx.accounts.user_trove.locked_coll_balance -= amount;
    ctx.accounts.token_vault.total_coll -= amount;

    Ok(())
}

pub fn process_harvest_orca_reward(
    ctx: Context<HarvestOrcaReward>,
    ratio_authority_bump: u8
) -> ProgramResult {
    let mut data: Vec<u8> = vec![];
    data.push(OrcaInstrunction::Harvest as u8);

    invoke_signed(
        &Instruction {
            program_id: ctx.accounts.orca_farm_program.key(),
            data,
            accounts: vec![
                // farm owner
                AccountMeta::new(ctx.accounts.ratio_authority.key(), true),
                // global farm
                AccountMeta::new(ctx.accounts.global_farm.key(), false),
                // user farm
                AccountMeta::new(ctx.accounts.ratio_user_farm.key(), false),
                // orca base vault
                AccountMeta::new_readonly(ctx.accounts.orca_base_vault.key(), false),
                // orca reward vault
                AccountMeta::new(ctx.accounts.orca_reward_vault.key(), false),
                // reward_token_account
                AccountMeta::new(ctx.accounts.user_reward_token_account.key(), false),
                // orca farm authority
                AccountMeta::new_readonly(ctx.accounts.authority.key(), false),
                // token program
                AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
            ]
        },
        &[
            ctx.accounts.ratio_authority.to_account_info().clone(),
            ctx.accounts.global_farm.clone(),
            ctx.accounts.ratio_user_farm.clone(),
            ctx.accounts.orca_base_vault.to_account_info().clone(),
            ctx.accounts.orca_reward_vault.to_account_info().clone(),
            ctx.accounts.user_reward_token_account.to_account_info().clone(),
            ctx.accounts.authority.clone(),
            ctx.accounts.token_program.to_account_info().clone(),
            ctx.accounts.orca_farm_program.to_account_info().clone()
        ],
        &[&[
            RATIO_ORCA_AUTH_TAG, ctx.accounts.owner.key().as_ref(), &[ratio_authority_bump]
        ]]
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(ratio_authority_bump: u8)]
pub struct InitRatioUserFarm<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub global_farm: AccountInfo<'info>,

    #[account(mut)]
    pub ratio_user_farm: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [RATIO_ORCA_AUTH_TAG, payer.key().as_ref()],
        bump = ratio_authority_bump
    )]
    pub ratio_orca_authority: AccountInfo<'info>,

    pub orca_farm_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(is_dd: u8, orca_vault_nonce: u8)]
pub struct CreateOrcaVault<'info> {
    #[account(mut)]
    pub payer:  Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [ORCA_VAULT_TAG, lp_mint.key().as_ref()],
        bump = orca_vault_nonce,
        payer = payer,
        constraint = payer.key() == global_state.authority)]
    pub orca_vault: Account<'info, RatioOrcaVault>,

    #[account(mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce)]
    pub global_state: Account<'info, GlobalState>,

    pub base_mint: Account<'info, Mint>,
    pub lp_mint: Account<'info, Mint>,
    pub dd_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Orca LP Integration
#[derive(Accounts)]
#[instruction(amount: u64, ratio_authority_bump: u8)]
pub struct DepositOrcaLP<'info> {
    #[account(mut)]
    pub owner:  Signer<'info>,

    #[account(
        mut,
        seeds = [
            RATIO_ORCA_AUTH_TAG,
            owner.key().as_ref()
        ],
        bump = ratio_authority_bump
    )]
    pub ratio_authority: AccountInfo<'info>,

    #[account(mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut,
        seeds = [
            USER_TROVE_TAG,
            token_vault.key().as_ref(), 
            owner.key().as_ref()
        ],
        bump = user_trove.user_trove_nonce)]
    pub user_trove: Account<'info, UserTrove>,

    #[account(
        seeds = [
            TOKEN_VAULT_TAG, 
            pool_token_mint.key().as_ref()
        ],
        bump = token_vault.token_vault_nonce
    )]
    pub token_vault: Account<'info, TokenVault>,
    
    #[account(mut)]
    pub ratio_orca_vault: Account<'info, RatioOrcaVault>,
    
    #[account(
        mut,
        constraint = ratio_base_token_account.owner == ratio_authority.key()
    )]
    pub ratio_base_token_account: Box<Account<'info, TokenAccount>>,
    
    #[account(
        mut,
        constraint = ratio_pool_token_account.owner == ratio_authority.key()
    )]
    pub ratio_pool_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub pool_token_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = ratio_reward_token_account.owner == ratio_authority.key()
    )]
    pub ratio_reward_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub global_farm: AccountInfo<'info>,

    #[account(mut)]
    pub ratio_user_farm: AccountInfo<'info>,

    #[account(mut)]
    pub orca_reward_vault: Box<Account<'info, TokenAccount>>,    

    #[account(mut)]
    pub orca_base_vault: Box<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub authority: AccountInfo<'info>,
    pub orca_farm_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>
}

#[derive(Accounts)]
#[instruction(amount: u64, ratio_authority_bump: u8)]
pub struct WithdrawOrcaLP<'info> {
    #[account(mut)]
    pub owner:  Signer<'info>,

    #[account(
        mut,
        seeds = [
            RATIO_ORCA_AUTH_TAG,
            owner.key().as_ref()
        ],
        bump = ratio_authority_bump
    )]
    pub ratio_authority: AccountInfo<'info>,

    #[account(mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut,
        seeds = [
            USER_TROVE_TAG,
            token_vault.key().as_ref(), 
            owner.key().as_ref()
        ],
        bump = user_trove.user_trove_nonce)]
    pub user_trove: Account<'info, UserTrove>,

    #[account(
        seeds = [
            TOKEN_VAULT_TAG, 
            pool_token_mint.key().as_ref()
        ],
        bump = token_vault.token_vault_nonce
    )]
    pub token_vault: Account<'info, TokenVault>,

    #[account(mut)]
    pub ratio_orca_vault: Account<'info, RatioOrcaVault>,

    #[account(
        mut,
        constraint = user_base_token_account.owner == owner.key()
    )]
    pub user_base_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = ratio_pool_token_account.owner == ratio_authority.key()
    )]
    pub ratio_pool_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub pool_token_mint: AccountInfo<'info>,

    #[account(
        mut,
        constraint = user_reward_token_account.owner == owner.key()
    )]
    pub user_reward_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub global_farm: AccountInfo<'info>,

    #[account(mut)]
    pub ratio_user_farm: AccountInfo<'info>,

    #[account(mut)]
    pub orca_reward_vault: Box<Account<'info, TokenAccount>>,    

    #[account(mut)]
    pub orca_base_vault: Box<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub authority: AccountInfo<'info>,
    pub orca_farm_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>
}

#[derive(Accounts)]
#[instruction(ratio_authority_bump: u8)]
pub struct HarvestOrcaReward<'info> {
    #[account(mut)]
    pub owner:  Signer<'info>,

    #[account(
        mut,
        seeds = [
            RATIO_ORCA_AUTH_TAG,
            owner.key().as_ref()
        ],
        bump = ratio_authority_bump
    )]
    pub ratio_authority: AccountInfo<'info>,

    #[account(mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce)]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        mut,
        constraint = user_reward_token_account.owner == owner.key()
    )]
    pub user_reward_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub global_farm: AccountInfo<'info>,
    
    #[account(mut)]
    pub ratio_user_farm: AccountInfo<'info>,

    #[account(mut)]
    pub orca_reward_vault: Box<Account<'info, TokenAccount>>,    

    #[account(mut)]
    pub orca_base_vault: Box<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub authority: AccountInfo<'info>,
    pub orca_farm_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>
}
