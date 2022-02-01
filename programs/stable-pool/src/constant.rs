pub const GLOBAL_STATE_TAG: &[u8] = b"global-state-seed";
pub const TOKEN_VAULT_TAG: &[u8] = b"token-vault-seed";
pub const USER_TROVE_TAG: &[u8] = b"user-trove";
pub const USD_MINT_TAG: &[u8] = b"usd-mint";
pub const USER_USD_TOKEN_TAG: &[u8] = b"usd-token";
pub const USER_TROVE_POOL_TAG: &[u8] = b"user-trove-pool";
pub const ORCA_VAULT_TAG: &[u8] = b"orca-vault-seed";
pub const RATIO_ORCA_AUTH_TAG: &[u8] = b"cdp-orca-auth";

pub const USD_DECIMALS: u8 = 6;

pub enum ORCA_INSTRUCTIONS {
    InitGlobalFarm,
    InitUserFarm,
    ConvertTokens,
    RevertTokens,
    Harvest,
    RemoveRewards,
    SetEmissionsPerSecond,
}
pub const USER_TROVE_REWARD_A_TAG: &[u8] = b"user-trove-reward-a";
pub const USER_TROVE_REWARD_B_TAG: &[u8] = b"user-trove-reward-b";

pub const RAYDIUM_USER_ACCOUNT_SIZE: usize = 248;
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
