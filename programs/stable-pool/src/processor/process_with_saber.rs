use anchor_lang::prelude::*;
use quarry_mine::cpi::{accounts::CreateMiner, create_miner};
// local
use crate::{
    constant::*,
    error::*,
    instructions::*,
    states::PlatformType,
    utils::{harvest_from_saber_pda, stake_to_saber_pda, unstake_from_saber_pda},
};

impl<'info> CreateQuarryMiner<'info> {
    /// Claims rewards from saber farm
    pub fn create(&mut self, miner_bump: u8, miner_vault_bump: u8) -> ProgramResult {
        let vault = &mut self.vault;

        require!(
            vault.platform_type == PlatformType::Saber as u8,
            StablePoolError::InvalidSaberPlatform
        );

        let trove = &mut self.trove;

        let vault_key = vault.key();
        let owner_key = self.payer.key();

        let authority_seeds = &[
            TROVE_SEED.as_ref(),
            vault_key.as_ref(),
            owner_key.as_ref(),
            &[trove.trove_nonce],
        ];
        create_miner(
            CpiContext::new(
                self.quarry_program.to_account_info(),
                CreateMiner {
                    authority: self.trove.to_account_info(),
                    miner: self.miner.to_account_info(),
                    quarry: self.quarry.to_account_info(),
                    miner_vault: self.miner_vault.to_account_info(),
                    token_mint: self.token_mint.to_account_info(),
                    rewarder: self.rewarder.to_account_info(),
                    payer: self.payer.to_account_info(),
                    token_program: self.token_program.to_account_info(),
                    system_program: self.system_program.to_account_info(),
                },
            )
            .with_signer(&[&authority_seeds[..]]),
            miner_bump,
        )?;

        Ok(())
    }
}

impl<'info> SaberStaker<'info> {
    /// Claims rewards from saber farm
    pub fn deposit(&mut self, amount: u64) -> ProgramResult {
        self.ratio_staker.deposit(amount)?;

        let vault = &mut self.ratio_staker.vault;
        let trove = &mut self.ratio_staker.trove;
        require!(
            vault.platform_type == PlatformType::Saber as u8,
            StablePoolError::InvalidSaberPlatform
        );

        let vault_key = vault.key();
        let owner_key = self.ratio_staker.authority.key();

        let authority_seeds = &[
            TROVE_SEED.as_ref(),
            vault_key.as_ref(),
            owner_key.as_ref(),
            &[trove.trove_nonce],
        ];
        stake_to_saber_pda(
            self.saber_farm_program.to_account_info(),
            self.ratio_staker.token_program.to_account_info(),
            self.ratio_staker.trove.to_account_info(),
            &self.saber_farm,
            self.ratio_staker.ata_trove.to_account_info(),
            self.saber_farm_rewarder.to_account_info(),
            amount,
            authority_seeds,
        )?;

        Ok(())
    }
    pub fn withdraw(&mut self, amount: u64) -> ProgramResult {
        let vault = &mut self.ratio_staker.vault;
        let trove = &mut self.ratio_staker.trove;
        require!(
            vault.platform_type == PlatformType::Saber as u8,
            StablePoolError::InvalidSaberPlatform
        );

        let vault_key = vault.key();
        let owner_key = self.ratio_staker.authority.key();

        let authority_seeds = &[
            TROVE_SEED.as_ref(),
            vault_key.as_ref(),
            owner_key.as_ref(),
            &[trove.trove_nonce],
        ];

        unstake_from_saber_pda(
            self.saber_farm_program.to_account_info(),
            self.ratio_staker.token_program.to_account_info(),
            self.ratio_staker.trove.to_account_info(),
            &self.saber_farm,
            self.ratio_staker.ata_trove.to_account_info(),
            self.saber_farm_rewarder.to_account_info(),
            amount,
            authority_seeds,
        )?;

        self.ratio_staker.withdraw(amount)?;

        Ok(())
    }
}

impl<'info> HarvestFromSaber<'info> {
    pub fn harvest(&mut self) -> ProgramResult {
        let vault = &mut self.ratio_harvester.vault;
        let trove = &mut self.ratio_harvester.trove;
        require!(
            vault.platform_type == PlatformType::Saber as u8,
            StablePoolError::InvalidSaberPlatform
        );

        let vault_key = vault.key();
        let owner_key = self.ratio_harvester.authority.key();

        let authority_seeds = &[
            TROVE_SEED.as_ref(),
            vault_key.as_ref(),
            owner_key.as_ref(),
            &[trove.trove_nonce],
        ];

        harvest_from_saber_pda(
            self.saber_farm_program.to_account_info(),
            self.ratio_harvester.token_program.to_account_info(),
            self.ratio_harvester.trove.to_account_info(),
            self.ratio_harvester.trove_reward.to_account_info(),
            self.ata_user_coll.to_account_info(),
            &self.saber_farm,
            self.saber_farm_rewarder.to_account_info(),
            self.mint_wrapper.to_account_info(),
            self.mint_wrapper_program.to_account_info(),
            self.minter.to_account_info(),
            self.rewards_token_mint.to_account_info(),
            self.claim_fee_token_account.to_account_info(),
            authority_seeds,
        )?;

        self.ratio_harvester.harvest()?;

        Ok(())
    }
}
