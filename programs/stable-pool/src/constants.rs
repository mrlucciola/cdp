// seeds
pub const GLOBAL_STATE_SEED: &[u8] = b"GLOBAL_STATE_SEED";
pub const MINT_USDX_SEED: &[u8] = b"MINT_USDX_SEED";
pub const USER_USDX_SEED: &[u8] = b"USER_USDX_SEED";
pub const VAULT_SEED: &[u8] = b"VAULT_SEED";
pub const TROVE_SEED: &[u8] = b"TROVE_SEED";
pub const TROVE_POOL_SEED: &[u8] = b"TROVE_POOL_SEED";
// numbers
pub const USDX_DECIMALS: u8 = 6;
pub const DEFAULT_FEE_NUMERATOR: u128 = 3;
pub const DEFAULT_FEE_DENOMINATOR: u128 = 1000;
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
