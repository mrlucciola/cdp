// libraries
use anchor_lang::prelude::*;
// local imports
pub mod constants;
pub mod enums;
pub mod errors;
pub mod instructions;
pub mod states;
pub mod utils;
pub mod saber_utils;

use crate::instructions::*;
use crate::utils::is_global_state_paused;

declare_id!("FvTjLbwbHY4v8Gfv18JKuPCJG2Hj87CG8kPNHqGeHAR4");

#[program]
pub mod stable_pool {
    use super::*;

    pub fn create_global_state(
        ctx: Context<CreateGlobalState>,
        global_state_bump: u8,
        mint_usdx_bump: u8,
        tvl_limit: u64,
        debt_ceiling: u64,
        price_feed_updater: Pubkey,
    ) -> Result<()> {
        create_global_state::handle(
            ctx,
            global_state_bump,
            mint_usdx_bump,
            tvl_limit,
            debt_ceiling,
            price_feed_updater,
        )
    }

    pub fn create_vault(
        ctx: Context<CreateVault>,
        vault_bump: u8,
        risk_level: u8,
        is_dual: u8,
        debt_ceiling: u64,
        platform_type: u8,
        reward_mints: Vec<Pubkey>,
    ) -> Result<()> {
        create_vault::handle(
            ctx,
            vault_bump,
            risk_level,
            is_dual,
            debt_ceiling,
            platform_type,
            reward_mints,
        )
    }

    pub fn create_trove(
        ctx: Context<CreateTrove>,
        trove_bump: u8,
        ata_trove_bump: u8,
        ceiling: u64,
    ) -> Result<()> {
        create_trove::handle(ctx, trove_bump, ata_trove_bump, ceiling)
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, deposit_amount: u64) -> Result<()> {
        deposit_collateral::handle(ctx, deposit_amount)
    }
    pub fn withdraw_collateral(
        ctx: Context<WithdrawCollateral>,
        withdraw_amount: u64,
    ) -> Result<()> {
        withdraw_collateral::handle(ctx, withdraw_amount)
    }

    /// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
    #[access_control(is_global_state_paused(&ctx.accounts.global_state))]
    pub fn borrow_usdx(
        ctx: Context<BorrowUsdx>,
        borrow_amount: u64,
    ) -> Result<()> {
        borrow_usdx::handle(ctx, borrow_amount)
    }
    pub fn create_reward_vault(ctx: Context<CreateUserRewardVault>) -> Result<()> {
        ctx.accounts.handle()
    }
    pub fn create_saber_user(ctx: Context<CreateQuarryMiner>, miner_bump: u8) -> Result<()> {
        ctx.accounts.handle(miner_bump)
    }
    pub fn create_oracle(ctx: Context<CreatePriceFeed>, price: u64) -> Result<()> {
        create_price_feed::handle(ctx, price)
    }
    pub fn report_price(ctx: Context<UpdatePriceFeed>, price: u64) -> Result<()> {
        update_price_feed::handle(ctx, price)
    }
}
