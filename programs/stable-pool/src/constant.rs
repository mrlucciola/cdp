use anchor_lang::constant;

pub const GLOBAL_STATE_SEED: &[u8] = b"GLOBAL_STATE_TAG"; // prev: GLOBAL_STATE_TAG & global-state-seed
pub const VAULT_SEED: &[u8] = b"VAULT_SEED";
pub const TROVE_SEED: &[u8] = b"TROVE_SEED";
pub const MINT_USD_SEED: &[u8] = b"MINT_USD_SEED"; // prev: USD_MINT_TAG & usd-mint
pub const USD_TOKEN_SEED: &[u8] = b"USD_TOKEN_SEED"; // prev: USD_TOKEN_TAG & usd-token
pub const TROVE_POOL_SEED: &[u8] = b"TROVE_POOL_SEED"; // used for ATA trove  prev: USER_TROVE_POOL_TAG
pub const PRICE_FEED_TAG: &[u8] = b"price-feed";

pub const USD_DECIMALS: u8 = 6;

pub const DEFAULT_FEE_NUMERATOR: u128 = 3;
pub const DEFAULT_FEE_DENOMINATOR: u128 = 1000;

#[constant]
pub const RISK_TYPE_COUNT: u8 = 10;
#[constant]
pub const RATIO_DENOMINATOR: u64 = 100_000_000;
pub const DEFAULT_RATIOS: [u64; 10] = [
    99009901, // AAA
    97799511, // AA
    96618357, // A
    95011876, // BBB
    93023256, // BB
    91116173, // B
    90090090, // CCC
    89086860, // CC
    88105727, // C
    86206897, // D
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
