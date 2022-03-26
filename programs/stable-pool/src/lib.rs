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
// crates
use crate::instructions::*;
use crate::utils::is_global_state_paused;

declare_id!("FvTjLbwbHY4v8Gfv18JKuPCJG2Hj87CG8kPNHqGeHAR4");

#[program]
pub mod stable_pool {
    use super::*;

    /**
     * Create global state account
     * This account holds all of the global platform variables
     *
     * Should only be called by the program deployer
     *
     * aliases: create_global_state, CreateGlobalState, createGlobalState
     */
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

    /**
     * TODO: rename vault -> pool
     *
     * Create a pool for a given collateral
     * The CDP platform supports multiple collateral types-
     * Each pool account holds variables that regulate user activity
     * Pool accounts for various collateral types may have different values for different variables
     * Pool accounts need to hold the mint and oracle values for each of its underlying tokens
     *
     * Should only be called by the program deployer
     *
     * aliases: create_pool, CreatePool, createVault
     * aliases: create_vault, CreateVault, createVault
     */
    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_bump: u8,
        risk_level: u8,
        is_dual: u8,
        debt_ceiling: u64,
        platform_type: u8,
        mint_token_a: Pubkey,
        mint_token_b: Pubkey,
        reward_mints: Vec<Pubkey>,
        token_a_decimals: u8,
        token_b_decimals: u8,
    ) -> Result<()> {
        create_pool::handle(
            ctx,
            pool_bump,
            risk_level,
            is_dual,
            debt_ceiling,
            platform_type,
            mint_token_a,
            mint_token_b,
            reward_mints,
            token_a_decimals,
            token_b_decimals,
        )
    }

    /**
     * TODO: rename trove -> vault
     *
     * Create a user-generated, user-authorized, single-collateral token repository
     *
     * aliases: create_trove, CreateTrove, createTrove
     */
    pub fn create_trove(
        ctx: Context<CreateTrove>,
        trove_bump: u8,
        ata_trove_bump: u8,
    ) -> Result<()> {
        create_trove::handle(ctx, trove_bump, ata_trove_bump)
    }

    /**
     * TODO: rename trove -> vault
     *
     * Deposit collateral to a trove
     * When collateral sits in a trove, it is able to be staked/farmed out and generate rewards
     * (sidenote) Collateral in itself generates yield from the platform it originated from
     *
     * aliases: deposit_collateral, DepositCollateral, depositCollateral
     */
    pub fn deposit_collateral(ctx: Context<DepositCollateral>, deposit_amount: u64) -> Result<()> {
        deposit_collateral::handle(ctx, deposit_amount)
    }

    /**
     * TODO: rename trove -> vault
     *
     * Withdraw collateral from trove
     * Collateral token goes from Trove -> User ATA
     *
     * aliases: withdraw_collateral, WithdrawCollateral, withdrawCollateral
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
     * Take out debt in the form of USDx
     * Must be overcollateralized according to the LTV (collateralization ratio) set by the pool
     * Must not exceed the global debt limit
     * Must not exceed the pool debt limit
     * Must not exceed the user debt limit
     *
     * aliases: borrow_usdx, BorrowUsdx, borrowUsdx
     */
    #[access_control(is_global_state_paused(&ctx.accounts.global_state))]
    pub fn borrow_usdx(ctx: Context<BorrowUsdx>, borrow_amount: u64) -> Result<()> {
        borrow_usdx::handle(ctx, borrow_amount)
    }

    #[access_control(is_global_state_paused(&ctx.accounts.global_state))]
    pub fn repay_usdx(
        ctx: Context<RepayUsdx>,
        repay_amount: u64,
    ) -> Result<()> {
        repay_usdx::handle(ctx, repay_amount)
    }

    /**
     * TODO: refactor this to match the other style of writing functions
     *
     * Create the user-derived account where reward tokens are deposited to upon harvest
     */
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

    /**
     * TODO: Need to create treasury
     * This function updates the harvest fee on the global state
     */
    pub fn set_harvest_fee(ctx: Context<SetHarvestFee>, fee_num: u64) -> Result<()> {
        set_harvest_fee::handle(ctx, fee_num)
    }

    /**
     * Update the global state variable "paused"
     * Should only be called by the program deployer
     */
    pub fn toggle_emer_state(ctx: Context<ToggleEmerState>, new_state: u8) -> Result<()> {
        toggle_emer_state::handle(ctx, new_state)
    }
    /**
     * Update the global state variable "treasury"
     * Should only be called by the program deployer
     */
    pub fn change_treasury_wallet(
        ctx: Context<ChangeTreasuryWallet>,
        new_treasury: Pubkey,
    ) -> Result<()> {
        change_treasury_wallet::handle(ctx, new_treasury)
    }
}
