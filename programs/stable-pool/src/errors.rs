use anchor_lang::prelude::*;

#[error_code]
pub enum StablePoolError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,

    #[msg("AlreadyInUse")]
    AlreadyInUse,

    #[msg("InvalidProgramAddress")]
    InvalidProgramAddress,

    #[msg("InvalidState")]
    InvalidState,

    #[msg("InvalidOwner")]
    InvalidOwner,

    #[msg("NotAllowed")]
    NotAllowed,

    #[msg("Math operation overflow")]
    MathOverflow,

    #[msg("InvalidOracleConfig")]
    InvalidOracleConfig,

    #[msg("InvalidAccountInput")]
    InvalidAccountInput,

    #[msg("This function works on devnet only")]
    InvalidCluster,

    #[msg("Global TVL Exceeded")]
    GlobalTVLExceeded,

    #[msg("LTV Exceeded")]
    LTVExceeded,

    #[msg("Global Debt Ceiling Exceeded")]
    GlobalDebtCeilingExceeded,

    // TODO: rename vault -> pool
    #[msg("Vault Debt Ceiling Exceeded")]
    VaultDebtCeilingExceeded,

    #[msg("User Debt Ceiling Exceeded")]
    UserDebtCeilingExceeded,

    #[msg("Can't withdraw due to debt")]
    WithdrawNotAllowedWithDebt,

    #[msg("Transfer amount is invalid")]
    InvalidTransferAmount,

    #[msg("Invalid platform type")]
    InvalidPlatformType,

    #[msg("Invalid saber platform")]
    InvalidSaberPlatform,

    #[msg("Reward Mint should be more than one")]
    InvalidRewardMintCount,

    #[msg("Attempting to repay more than the amount originally borrowed")]
    RepayingMoreThanBorrowed,
}
