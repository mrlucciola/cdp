use anchor_lang::prelude::*;
// use anchor_spl::token::{self,  Transfer, ID};

use crate::{
    instructions::*,
    processor::*,
    utils::{
        stake_to_saber_pda,
        unstake_from_saber_pda,
        harvest_from_saber_pda
    },
    constant::*,
    error::*,
    states::PlatformType,
};
use quarry_mine::cpi::{
    create_miner, 
    accounts::{
        CreateMiner
    }
};
impl<'info> CreateQuarryMiner<'info> {
    /// Claims rewards from saber farm
    pub fn create(&mut self, miner_bump:u8, miner_vault_bump: u8) -> ProgramResult {

        let token_vault = &mut self.token_vault;

        require!(token_vault.platform_type == PlatformType::Saber as u8, StablePoolError::InvalidSaberPlatform);

        let user_trove = &mut self.user_trove;

        let token_vault_key = token_vault.key();
        let owner_key = self.payer.key();
        
        let authority_seeds = &[USER_TROVE_TAG.as_ref(), token_vault_key.as_ref(), owner_key.as_ref(), &[user_trove.user_trove_nonce]];
        create_miner(CpiContext::new(
            self.quarry_program.to_account_info(),
            CreateMiner{
                authority: self.user_trove.to_account_info(),
                miner: self.miner.to_account_info(),
                quarry: self.quarry.to_account_info(),
                miner_vault: self.miner_vault.to_account_info(),
                token_mint: self.token_mint.to_account_info(),
                rewarder: self.rewarder.to_account_info(),
                payer: self.payer.to_account_info(),
                token_program: self.token_program.to_account_info(),
                system_program: self.system_program.to_account_info(),
            }
        ).with_signer(&[&authority_seeds[..]]), 
        miner_bump)?;

        Ok(())
    }
}

impl<'info> SaberStaker<'info> {
    /// Claims rewards from saber farm
    pub fn deposit(&mut self, amount: u64, ) -> ProgramResult {
        self.ratio_staker.deposit(amount)?;

        let token_vault = &mut self.ratio_staker.token_vault;
        let user_trove = &mut self.ratio_staker.user_trove;
        require!(token_vault.platform_type == PlatformType::Saber as u8, StablePoolError::InvalidSaberPlatform);

        let token_vault_key = token_vault.key();
        let owner_key = self.ratio_staker.owner.key();
        
        let authority_seeds = &[USER_TROVE_TAG.as_ref(), token_vault_key.as_ref(), owner_key.as_ref(), &[user_trove.user_trove_nonce]];
        stake_to_saber_pda(
            self.saber_farm_program.to_account_info(),
            self.ratio_staker.token_program.to_account_info(),
            self.ratio_staker.user_trove.to_account_info(),
            &self.saber_farm,
            self.ratio_staker.pool_token_coll.to_account_info(),
            self.saber_farm_rewarder.to_account_info(),
            amount,
            authority_seeds
        )?;

        Ok(())
    }
    pub fn withdraw(&mut self, amount: u64, ) -> ProgramResult {

        let token_vault = &mut self.ratio_staker.token_vault;
        let user_trove = &mut self.ratio_staker.user_trove;
        require!(token_vault.platform_type == PlatformType::Saber as u8, StablePoolError::InvalidSaberPlatform);

        let token_vault_key = token_vault.key();
        let owner_key = self.ratio_staker.owner.key();
        
        let authority_seeds = &[USER_TROVE_TAG.as_ref(), token_vault_key.as_ref(), owner_key.as_ref(), &[user_trove.user_trove_nonce]];
    
        unstake_from_saber_pda(
            self.saber_farm_program.to_account_info(),
            self.ratio_staker.token_program.to_account_info(),
            self.ratio_staker.user_trove.to_account_info(),
            &self.saber_farm,
            self.ratio_staker.pool_token_coll.to_account_info(),
            self.saber_farm_rewarder.to_account_info(),
            amount,
            authority_seeds
        )?;
        
        self.ratio_staker.withdraw(amount)?;
        
        Ok(())
    }
}

impl<'info> HarvestFromSaber<'info> {
    pub fn harvest(&mut self,) -> ProgramResult {

        let token_vault = &mut self.ratio_harvester.token_vault;
        let user_trove = &mut self.ratio_harvester.user_trove;
        require!(token_vault.platform_type == PlatformType::Saber as u8, StablePoolError::InvalidSaberPlatform);
        
        let token_vault_key = token_vault.key();
        let owner_key = self.ratio_harvester.authority.key();
        
        let authority_seeds = &[USER_TROVE_TAG.as_ref(), token_vault_key.as_ref(), owner_key.as_ref(), &[user_trove.user_trove_nonce]];

        harvest_from_saber_pda(
            self.saber_farm_program.to_account_info(),
            self.ratio_harvester.token_program.to_account_info(),
            self.ratio_harvester.user_trove.to_account_info(),
            self.ratio_harvester.user_trove_reward.to_account_info(),
            self.user_token_coll.to_account_info(),
    
            &self.saber_farm,
            
            self.saber_farm_rewarder.to_account_info(),
    
            self.mint_wrapper.to_account_info(),
            self.mint_wrapper_program.to_account_info(),
            self.minter.to_account_info(),
            self.rewards_token_mint.to_account_info(),
            self.claim_fee_token_account.to_account_info(),
            authority_seeds
        )?;

        self.ratio_harvester.harvest()?;
        
        Ok(())
    }
}
