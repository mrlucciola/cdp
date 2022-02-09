use anchor_lang::{
    prelude::*,
    solana_program::{
        program::{invoke, invoke_signed},
        instruction::{AccountMeta, Instruction},
        system_instruction
    }
};
use anchor_spl::token::{Token, Mint, TokenAccount};

use crate::{states::*, constant::*};

impl<'info> InitRatioUserFarm<'info> {
    pub fn init(
        &mut self,
        ratio_authority_bump: u8
    ) -> ProgramResult {
        // todo: Have a test if the ratio_orca_authority is going to die
        let rent = Rent::get()?;
        if self.ratio_orca_authority.data_is_empty() {
            let required_lamports = 
                rent.minimum_balance(ORCA_USER_FARM_SIZE as usize)
                .max(1)
                .saturating_sub(self.ratio_orca_authority.lamports());
            msg!("required lamports {:?}", required_lamports);
            if required_lamports > 0 {
                invoke(
                    &system_instruction::transfer(
                        &self.payer.key(),
                        &self.ratio_orca_authority.key(),
                        required_lamports
                    ),
                    &[
                        self.payer.to_account_info(),
                        self.ratio_orca_authority.to_account_info(),
                        self.system_program.to_account_info()
                    ]
                )?;
            }
        }
        invoke_signed( 
            &Instruction {
                program_id: self.orca_farm_program.key(),
                data: vec![OrcaInstrunction::InitUserFarm as u8],
                accounts: vec![
                    // global farm
                    AccountMeta::new_readonly(self.global_farm.key(), false),
                    // user farm
                    AccountMeta::new(self.ratio_user_farm.key(), false),
                    // farm owner
                    AccountMeta::new(self.ratio_orca_authority.key(), true),
                    AccountMeta::new_readonly(self.system_program.key(), false),
                ]
            },
            &[
                self.global_farm.to_account_info().clone(),
                self.ratio_user_farm.to_account_info().clone(),
                self.ratio_orca_authority.to_account_info().clone(),
                self.system_program.to_account_info().clone(),
                self.orca_farm_program.to_account_info().clone()
            ],
            &[&[
                RATIO_ORCA_AUTH_TAG, self.payer.key().as_ref(), &[ratio_authority_bump]
            ]]
        )?;
        Ok(())
    }
}

impl<'info> CreateOrcaVault<'info> {
    pub fn create_vault(
        &mut self, 
        is_dd: u8,
        orca_vault_nonce: u8
    ) -> ProgramResult {
        let orca_vault = &mut self.orca_vault;
        orca_vault.base_mint = self.base_mint.key();
        orca_vault.lp_mint = self.lp_mint.key();
        orca_vault.dd_mint = self.dd_mint.key();
        orca_vault.is_dd = is_dd;
        Ok(())
    }       
}

impl<'info> DepositOrcaLP<'info> {
    pub fn deposit(
        &mut self, 
        amount: u64, 
        ratio_authority_bump : u8,
    ) -> ProgramResult {
        let mut data: Vec<u8> = vec![];
        data.push(OrcaInstrunction::ConvertTokens as u8);
        data.extend(amount.to_le_bytes().to_vec());
        invoke_signed(
            &Instruction {
                program_id: self.orca_farm_program.key(),
                data,
                accounts: vec![
                    // farm owner
                    AccountMeta::new(self.ratio_authority.key(), true),
                    // base token account
                    AccountMeta::new(self.ratio_base_token_account.key(), false),
                    // orca base vault
                    AccountMeta::new(self.orca_base_vault.key(), false),
                    // transfer authority
                    AccountMeta::new(self.ratio_authority.key(), true),
                    // pool token mint
                    AccountMeta::new(self.pool_token_mint.key(), false),
                    // pool token account
                    AccountMeta::new(self.ratio_pool_token_account.key(), false),
                    // global farm
                    AccountMeta::new(self.global_farm.key(), false),
                    // user farm
                    AccountMeta::new(self.ratio_user_farm.key(), false),
                    // orca reward vault
                    AccountMeta::new(self.orca_reward_vault.key(), false),
                    // reward_token_account
                    AccountMeta::new(self.ratio_reward_token_account.key(), false),
                    // orca farm authority
                    AccountMeta::new_readonly(self.authority.key(), false),
                    // token program
                    AccountMeta::new_readonly(self.token_program.key(), false),
                ]
            },
            &[
                self.ratio_authority.to_account_info().clone(),
                self.ratio_base_token_account.to_account_info().clone(),
                self.orca_base_vault.to_account_info().clone(),
                self.ratio_authority.to_account_info().clone(),
                self.pool_token_mint.to_account_info().clone(),
                self.ratio_pool_token_account.to_account_info().clone(),
                self.global_farm.clone(),
                self.ratio_user_farm.clone(),
                self.orca_reward_vault.to_account_info().clone(),
                self.ratio_reward_token_account.to_account_info().clone(),
                self.authority.clone(),
                self.token_program.to_account_info().clone(),
                self.orca_farm_program.to_account_info().clone()
            ],
            &[&[
                RATIO_ORCA_AUTH_TAG, self.owner.key().as_ref(), &[ratio_authority_bump]
            ]]
        )?;
    
        self.user_trove.locked_coll_balance += amount;
        self.token_vault.total_coll += amount;
        Ok(())
    }
    
}

impl<'info> WithdrawOrcaLP<'info> {
    pub fn withdraw(
        &mut self, 
        amount: u64,
        ratio_authority_bump : u8
    ) -> ProgramResult {
    
        // First, Unstake Ratio's LP tokens to baseToken
        let mut data: Vec<u8> = vec![];
        data.push(OrcaInstrunction::RevertTokens as u8);
        data.extend(amount.to_le_bytes().to_vec());
    
        invoke_signed(
            &Instruction {
                program_id: self.orca_farm_program.key(),
                data,
                accounts: vec![
                    // farm owner
                    AccountMeta::new(self.ratio_authority.key(), true),
                    // base token account
                    AccountMeta::new(self.user_base_token_account.key(), false),
                    // orca base vault
                    AccountMeta::new(self.orca_base_vault.key(), false),
                    // pool token mint
                    AccountMeta::new(self.pool_token_mint.key(), false),
                    // pool token account
                    AccountMeta::new(self.ratio_pool_token_account.key(), false),
                    // burn authority
                    //AccountMeta::new_readonly(self.owner.key(), true),
                    AccountMeta::new(self.ratio_authority.key(), true),
                    // global farm
                    AccountMeta::new(self.global_farm.key(), false),
                    // user farm
                    AccountMeta::new(self.ratio_user_farm.key(), false),
                    // orca reward vault
                    AccountMeta::new(self.orca_reward_vault.key(), false),
                    // reward_token_account
                    AccountMeta::new(self.user_reward_token_account.key(), false),
                    // orca farm authority
                    AccountMeta::new_readonly(self.authority.key(), false),
                    // token program
                    AccountMeta::new_readonly(self.token_program.key(), false),
                ]
            },
            &[
                self.ratio_authority.clone(),
                self.user_base_token_account.to_account_info().clone(),
                self.orca_base_vault.to_account_info().clone(),
                self.pool_token_mint.to_account_info().clone(),
                self.ratio_pool_token_account.to_account_info().clone(),
                self.ratio_authority.clone(),
                self.global_farm.clone(),
                self.ratio_user_farm.clone(),
                self.orca_reward_vault.to_account_info().clone(),
                self.user_reward_token_account.to_account_info().clone(),
                self.authority.clone(),
                self.token_program.to_account_info().clone(),
                self.orca_farm_program.to_account_info().clone()
            ],
            &[&[
                RATIO_ORCA_AUTH_TAG, self.owner.key().as_ref(), &[ratio_authority_bump]
            ]]
        )?;
        
        self.user_trove.locked_coll_balance -= amount;
        self.token_vault.total_coll -= amount;
    
        Ok(())
    }
    
}

impl<'info> HarvestOrcaReward<'info> {
    pub fn harvest(
        &mut self,
        ratio_authority_bump: u8
    ) -> ProgramResult {
        let mut data: Vec<u8> = vec![];
        data.push(OrcaInstrunction::Harvest as u8);
    
        invoke_signed(
            &Instruction {
                program_id: self.orca_farm_program.key(),
                data,
                accounts: vec![
                    // farm owner
                    AccountMeta::new(self.ratio_authority.key(), true),
                    // global farm
                    AccountMeta::new(self.global_farm.key(), false),
                    // user farm
                    AccountMeta::new(self.ratio_user_farm.key(), false),
                    // orca base vault
                    AccountMeta::new_readonly(self.orca_base_vault.key(), false),
                    // orca reward vault
                    AccountMeta::new(self.orca_reward_vault.key(), false),
                    // reward_token_account
                    AccountMeta::new(self.user_reward_token_account.key(), false),
                    // orca farm authority
                    AccountMeta::new_readonly(self.authority.key(), false),
                    // token program
                    AccountMeta::new_readonly(self.token_program.key(), false),
                ]
            },
            &[
                self.ratio_authority.to_account_info().clone(),
                self.global_farm.clone(),
                self.ratio_user_farm.clone(),
                self.orca_base_vault.to_account_info().clone(),
                self.orca_reward_vault.to_account_info().clone(),
                self.user_reward_token_account.to_account_info().clone(),
                self.authority.clone(),
                self.token_program.to_account_info().clone(),
                self.orca_farm_program.to_account_info().clone()
            ],
            &[&[
                RATIO_ORCA_AUTH_TAG, self.owner.key().as_ref(), &[ratio_authority_bump]
            ]]
        )?;
    
        Ok(())
    }
    
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
    pub pool_token_mint: Box<Account<'info, Mint>>,

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
