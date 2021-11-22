pub const GLOBAL_STATE_TAG:&[u8] = b"golbal-state-seed";
pub const TOKEN_VAULT_TAG:&[u8] = b"token-vault-seed";
pub const USER_TROVE_TAG:&[u8] = b"user-trove-seed";
pub const USD_MINT_TAG:&[u8] = b"usd-mint";
pub const TOKEN_VAULT_POOL_TAG:&[u8] = b"token-vault-pool";

pub const USD_DECIMALS: u8 = 6;


pub const LIMIT_MINT_TIME:u64 = {
    #[cfg(feature = "devnet")]
    {
        3600
    }
    #[cfg(not(feature = "devnet"))]
    {
        3600
    }
};

