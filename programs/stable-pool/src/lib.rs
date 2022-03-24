// libraries
use anchor_lang::prelude::*;
// local imports
pub mod constants;
pub mod enums;
pub mod errors;
pub mod instructions;
pub mod saber_utils;
pub mod states;
pub mod utils;

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
        global_debt_ceiling: u64,
        user_debt_ceiling: u64,
        oracle_reporter: Pubkey,
    ) -> Result<()> {
        create_global_state::handle(
            ctx,
            global_state_bump,
            mint_usdx_bump,
            tvl_limit,
            global_debt_ceiling,
            user_debt_ceiling,
            oracle_reporter,
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
    ) -> Result<()> {
        create_trove::handle(ctx, trove_bump, ata_trove_bump)
    }

    /**
     * 
     */
    pub fn deposit_collateral(ctx: Context<DepositCollateral>, deposit_amount: u64) -> Result<()> {
        deposit_collateral::handle(ctx, deposit_amount)
    }

    /**
     * Withdraw collateral from trove
     * TODO: rename trove -> vault
     */
    pub fn withdraw_collateral(
        ctx: Context<WithdrawCollateral>,
        withdraw_amount: u64,
    ) -> Result<()> {
        withdraw_collateral::handle(ctx, withdraw_amount)
    }

    /**
     * THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
     * 
     * Create the Saber liquidity miner account set by the Quarry framework/standard
     *
     * aliases: create_saber_quarry_miner, CreateSaberQuarryMiner, createSaberQuarryMiner
     * prev aliases: create_quarry_miner, CreateQuarryMiner, createQuarryMiner
     */
    #[access_control(is_global_state_paused(&ctx.accounts.global_state))]
    pub fn borrow_usdx(ctx: Context<BorrowUsdx>, borrow_amount: u64) -> Result<()> {
        borrow_usdx::handle(ctx, borrow_amount)
    }

    pub fn create_reward_vault(ctx: Context<CreateUserRewardVault>) -> Result<()> {
        ctx.accounts.handle()
    }

    /**
     * Create the Saber liquidity miner account set by the Quarry framework/standard
     *
     * aliases: create_saber_quarry_miner, CreateSaberQuarryMiner, createSaberQuarryMiner
     * prev aliases: create_quarry_miner, CreateQuarryMiner, createQuarryMiner
     */
    pub fn create_saber_quarry_miner(
        ctx: Context<CreateSaberQuarryMiner>,
        miner_bump: u8,
    ) -> Result<()> {
        create_saber_quarry_miner::handle(ctx, miner_bump)
    }

    /**
     * Create the account that holds the active USD price for a given single asset (i.e. USDC)
     *
     * aliases: create_oracle, CreateOracle, createOracle
     * previous aliases: create_price_feed, CreatePriceFeed, createPriceFeed
     * creates quarry miner account
     */
    pub fn create_oracle(ctx: Context<CreateOracle>, price: u64) -> Result<()> {
        create_oracle::handle(ctx, price)
    }

    /**
     * Report the current price of a token in USD to on-chain oracle account.
     * Price of a token comes from authorized reporter (backend)
     * Account should correspond only to the token being reported on, and should include the time of update
     *
     * Should only be called by the program deployer
     *
     * aliases: ReportPriceToOracle, report_price_to_oracle
     * prev: ReportPrice, report_price, reportPrice
     * prev: UpdatePriceFeed, update_price_feed, updatePriceFeed
     */
    pub fn report_price_to_oracle(ctx: Context<ReportPriceToOracle>, price: u64) -> Result<()> {
        report_price_to_oracle::handle(ctx, price)
    }

    /**
     * Update the global state variable "global_tvl_limit"
     * Should only be called by the program deployer
     */
    pub fn set_global_tvl_limit(ctx: Context<SetGlobalTvlLimit>, limit: u64) -> Result<()> {
        set_global_tvl_limit::handle(ctx, limit)
    }

    /**
     * Update the global state variable "global_debt_ceiling"
     * Should only be called by the program deployer
     */
    pub fn set_global_debt_ceiling(ctx: Context<SetGlobalDebtCeiling>, ceiling: u64) -> Result<()> {
        set_global_debt_ceiling::handle(ctx, ceiling)
    }

    /**
     * Update the global state variable "user_debt_ceiling"
     * Should only be called by the program deployer
     */
    pub fn set_user_debt_ceiling(ctx: Context<SetUserDebtCeiling>, ceiling: u64) -> Result<()> {
        set_user_debt_ceiling::handle(ctx, ceiling)
    }
}
