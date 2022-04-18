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

declare_id!("98B2NM7bqqzFb5drsVroZbw6Bsnabpm36mjmCMzCfiUC");

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
     * aliases: create_pool, CreatePool, createPool
     * aliases: create_vault, CreateVault, createVault
     */
    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_bump: u8,
        risk_level: u8,
        debt_ceiling: u64,
        platform_type: u8,
        mint_token_a: Pubkey,
        mint_token_b: Pubkey,
        mint_reward: Pubkey,
        token_a_decimals: u8,
        token_b_decimals: u8,
    ) -> Result<()> {
        create_pool::handle(
            ctx,
            pool_bump,
            risk_level,
            debt_ceiling,
            platform_type,
            mint_token_a,
            mint_token_b,
            mint_reward,
            token_a_decimals,
            token_b_decimals,
        )
    }

    /**
     *
     * Create a user-generated, user-authorized, state account
     *
     * aliases: create_user_state, CreateUserState, createUserState
     */
    pub fn create_user_state(ctx: Context<CreateUserState>) -> Result<()> {
        create_user_state::handle(ctx)
    }

    /**
     *
     * Create a user-generated, user-authorized, single-collateral token repository
     *
     * aliases: create_vault, CreateVault, createVault
     * aliases: create_trove, CreateTrove, createTrove
     */
    pub fn create_vault(
        ctx: Context<CreateVault>,
        vault_bump: u8,
        ata_collat_vault_bump: u8,
    ) -> Result<()> {
        create_vault::handle(ctx, vault_bump, ata_collat_vault_bump)
    }

    /**
     * Deposit collateral to a vault
     * When collateral sits in a vault, it is able to be staked/farmed out and generate rewards
     * (sidenote) Collateral in itself generates yield from the platform it originated from
     *
     * aliases: deposit_collateral, DepositCollateral, depositCollateral
     */
    #[access_control(is_global_state_paused(&ctx.accounts.global_state))]
    pub fn deposit_collateral(ctx: Context<DepositCollateral>, deposit_amount: u64) -> Result<()> {
        deposit_collateral::handle(ctx, deposit_amount)
    }

    /**
     *
     * Withdraw collateral from vault
     * Collateral token goes from Vault -> User ATA
     *
     * aliases: withdraw_collateral, WithdrawCollateral, withdrawCollateral
     */
    #[access_control(is_global_state_paused(&ctx.accounts.global_state))]
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
    pub fn repay_usdx(ctx: Context<RepayUsdx>, repay_amount: u64) -> Result<()> {
        repay_usdx::handle(ctx, repay_amount)
    }

    /**
     * Create the account that holds the active USD price for a given single asset (i.e. USDC)
     *
     * aliases: create_oracle, CreateOracle, createOracle
     * previous aliases: create_price_feed, CreatePriceFeed, createPriceFeed
     */
    pub fn create_oracle(ctx: Context<CreateOracle>) -> Result<()> {
        create_oracle::handle(ctx)
    }

    /**
     * Report the current price of a token in USD to on-chain oracle account.
     * Price of a token comes from authorized reporter (backend)
     * Account should correspond only to the token being reported on, and should include the time of update
     *
     * Should only be called by the program deployer
     *
     * aliases: ReportPriceToOracle, report_price_to_oracle, reportPriceToOracle
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
     * Update the pool variable "debt_ceiling"
     * Should only be called by the program deployer
     */
    pub fn set_pool_debt_ceiling(ctx: Context<SetPoolDebtCeiling>, ceiling: u64) -> Result<()> {
        set_pool_debt_ceiling::handle(ctx, ceiling)
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

    /**
     * Update the global state variable "authority"
     * Should only be called by the current authority in global state
     */
    pub fn change_authority(ctx: Context<ChangeAuthority>, new_authority: Pubkey) -> Result<()> {
        change_authority::handle(ctx, new_authority)
    }

    // SABER FUNCTIONS
    /**
     * TODO: refactor this to match the other style of writing functions
     *
     * Create the user-derived account where reward tokens are deposited to upon harvest
     */
    pub fn create_reward_vault(ctx: Context<CreateUserRewardVault>) -> Result<()> {
        create_reward_vault::handle(ctx)
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
     * stake_collateral_to_saber, StakeCollateralToSaber, stakeCollateralToSaber
     */
    pub fn stake_collateral_to_saber(
        ctx: Context<StakeCollateralToSaber>,
        amt_to_stake: Option<u64>,
    ) -> Result<()> {
        stake_collateral_to_saber::handle(ctx, amt_to_stake)
    }

    /**
     * aliases: unstake_collateral_from_saber, UnstakeCollateralFromSaber, unstakeCollateralFromSaber
     */
    pub fn unstake_collateral_from_saber(
        ctx: Context<UnstakeCollateralFromSaber>,
        amount: u64,
    ) -> Result<()> {
        unstake_collateral_from_saber::handle(ctx, amount)
    }

    // /**
    //  * aliases: harvest_rewards_from_saber, HarvestRewardsFromSaber, harvestRewardsFromSaber
    //  */
    // pub fn harvest_rewards_from_saber(ctx: Context<HarvestRewardsFromSaber>) -> Result<()> {
    //     harvest_rewards_from_saber_old::handle(ctx)
    // }
    #[access_control(is_global_state_paused(&ctx.accounts.global_state))]
    pub fn harvest_rewards_from_saber(ctx: Context<HarvestRewardsFromSaber>) -> Result<()> {
        harvest_rewards_from_saber::handle(ctx)
    }
}
