// seeds
pub const GLOBAL_STATE_SEED: &[u8] = b"GLOBAL_STATE_SEED";
pub const MINT_USDX_SEED: &[u8] = b"MINT_USDX_SEED";
pub const USER_USDX_SEED: &[u8] = b"USER_USDX_SEED";
pub const VAULT_SEED: &[u8] = b"VAULT_SEED";
pub const TROVE_SEED: &[u8] = b"TROVE_SEED";
pub const ORACLE_SEED: &[u8] = b"ORACLE_SEED";

// numbers
pub const DECIMALS_USD: u8 = 6;
pub const DECIMALS_USDX: u8 = 6;
pub const DECIMALS_PRICE: u64 = 8;
pub const DEFAULT_FEE_NUMERATOR: u32 = 3;
pub const DEFAULT_FEE_DENOMINATOR: u32 = 1000;
pub const DEFAULT_RATIOS_DECIMALS: u8 = 8;
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
