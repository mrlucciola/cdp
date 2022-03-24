import { PlatformType } from "./types";

// seeds
export const USDX_TOKEN_SEED = "USDX_TOKEN_SEED";
export const GLOBAL_STATE_SEED = "GLOBAL_STATE_SEED";
export const VAULT_SEED = "VAULT_SEED";
export const TROVE_SEED = "TROVE_SEED";
export const MINT_USDX_SEED = "MINT_USDX_SEED";
// delete?
export const USDX_MINT = "USDX_MINT";
export const USDX_TOKEN = "USDX_TOKEN";
export const USER_TROVE_POOL = "USER_TROVE_POOL";
export const ORACLE_SEED = "ORACLE_SEED";

// default values
export const DEPOSIT_AMOUNT = 100_000_000; // 0.1 Saber LP
export const TVL_LIMIT = 1_000_000_000;
export const GLOBAL_DEBT_CEILING = 15_000_000;
export const VAULT_DEBT_CEILING = 10_000_000;
export const USER_DEBT_CEILING = 5_000_000;
export const USDX_DECIMAL = 6;
export const SBR_DECIMAL = 6;
export const USDCUSDT_DECIMAL = 9;
// platform types
// export const PLATFORM_TYPE_RAYDIUM: PlatformType = 0; // TODO: Add in another ticket. jkap 2/13/22
// export const PLATFORM_TYPE_ORCA: PlatformType = 1; // TODO: Add in another ticket. jkap 2/13/22
export const PLATFORM_TYPE_SABER: PlatformType = 2;
// export const PLATFORM_TYPE_MERCURIAL: PlatformType = 3; // TODO: Add in another ticket. jkap 2/13/22
export const PLATFORM_TYPE_UNKNOWN: PlatformType = 4;

export const PRICE_DECIMALS = 100000000;
