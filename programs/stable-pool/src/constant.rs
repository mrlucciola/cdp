use anchor_lang::constant;

pub const GLOBAL_STATE_TAG: &[u8] = b"global-state-seed";
pub const TOKEN_VAULT_TAG: &[u8] = b"token-vault-seed";
pub const USER_TROVE_TAG: &[u8] = b"user-trove";
pub const USD_MINT_TAG: &[u8] = b"usd-mint";
pub const USER_USD_TOKEN_TAG: &[u8] = b"usd-token";
pub const USER_TROVE_POOL_TAG: &[u8] = b"user-trove-pool";
pub const ORCA_VAULT_TAG: &[u8] = b"orca-vault-seed";
pub const RATIO_ORCA_AUTH_TAG: &[u8] = b"cdp-orca-auth";

pub const USD_DECIMALS: u8 = 6;

pub const USER_TROVE_REWARD_A_TAG: &[u8] = b"user-trove-reward-a";
pub const USER_TROVE_REWARD_B_TAG: &[u8] = b"user-trove-reward-b";

pub const DEFAULT_FEE_NUMERATOR: u128 = 3;
pub const DEFAULT_FEE_DENOMINATOR: u128 = 1000;

pub const RAYDIUM_USER_ACCOUNT_SIZE: usize = 248;
pub const ORCA_USER_FARM_SIZE: usize = 106;

#[constant]
pub const RISK_TYPE_COUNT: u8 = 10;
#[constant]
pub const RATIO_DENOMINATOR: u64 = 100_000;
pub const DEFAULT_RATIOS: [u64; 10] = [
    102_500,    // AAA
    120_500,    // AA
    150_000,    // A
    175_500,    // BBB
    190_900,    // BB
    205_000,    // B
    250_000,    // CCC
    300_000,    // CC
    370_000,    // C
    500_000,    // D
];

pub const DEVNET_MODE: bool = {
    #[cfg(feature = "devnet")]
    {
        true
    }
    #[cfg(not(feature = "devnet"))]
    {
        false
    }
};

pub const LIMIT_MINT_TIME: u64 = {
    #[cfg(feature = "devnet")]
    {
        1
    }
    #[cfg(not(feature = "devnet"))]
    {
        0
    }
};
