import { PlatformType } from "./types";

// seeds
export const USDX_TOKEN_SEED = "USDX_TOKEN_SEED"; // prev: USD_TOKEN_TAG & usd-token
// TODO: integrate below seeds
export const TROVE_POOL_SEED = "TROVE_POOL_SEED"; // used for ATA trove    prev: USER_TROVE_POOL_TAG
export const GLOBAL_STATE_SEED = "GLOBAL_STATE_SEED"; // prev: GLOBAL_STATE_TAG & global-state-seed
export const VAULT_SEED = "VAULT_SEED";
export const TROVE_SEED = "TROVE_SEED"; // prev: USER_TROVE_TAG -> USER_TROVE -> "TROVE" & user-trove -> TROVE_SEED
export const MINT_USDX_SEED = "MINT_USDX_SEED"; // prev: USD_MINT_TAG & usd-mint
export const USDX_MINT = "USDX_MINT";
export const USDX_TOKEN = "USDX_TOKEN";
export const USER_TROVE_POOL = "USER_TROVE_POOL";
// default values
export const DEPOSIT_AMOUNT = 100_000_000; // 0.1 Saber LP
export const TVL_LIMIT = 1_000_000_000;
export const GLOBAL_DEBT_CEILING = 15_000_000;
export const VAULT_DEBT_CEILING = 10_000_000;
export const USDX_DECIMAL = 6;
// platform types
// export const PLATFORM_TYPE_RAYDIUM: PlatformType = 0; // TODO: Add in another ticket. jkap 2/13/22
// export const PLATFORM_TYPE_ORCA: PlatformType = 1; // TODO: Add in another ticket. jkap 2/13/22
export const PLATFORM_TYPE_SABER: PlatformType = 2;
// export const PLATFORM_TYPE_MERCURIAL: PlatformType = 3; // TODO: Add in another ticket. jkap 2/13/22
export const PLATFORM_TYPE_UNKNOWN: PlatformType = 4;
