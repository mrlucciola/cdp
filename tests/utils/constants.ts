import { PlatformType } from "./types";

// seeds
export const USDX_TOKEN_SEED = "USDX_TOKEN_SEED";
export const GLOBAL_STATE_SEED = "GLOBAL_STATE_SEED";
export const POOL_SEED = "POOL_SEED";
export const TROVE_SEED = "TROVE_SEED";
export const MINT_USDX_SEED = "MINT_USDX_SEED";
export const ORACLE_SEED = "ORACLE_SEED";

// default platform values
export const EMER_STATE_DISABLED = 0;
export const TVL_LIMIT_USD = 1_000_000;
export const DEBT_CEILING_GLOBAL_USDX = 500_000;
export const DEBT_CEILING_POOL_USDX = 500_000;
export const DEBT_CEILING_USER_USDX = 1_000;
export const DECIMALS_USDX = 6;
export const DECIMALS_USD = 6;
export const DECIMALS_PRICE = 8;
export const DEFAULT_FEE_NUMERATOR = 30;
// test vars
export const DECIMALS_SBR = 6; // included on state acct
export const DECIMALS_USDCUSDT = 6; // included on state acct
export const DECIMALS_USDC = 6; // included on state acct
export const DECIMALS_USDT = 6; // included on state acct

// platform types
// export const PLATFORM_TYPE_RAYDIUM: PlatformType = 0; // TODO: Add in another ticket. jkap 2/13/22
// export const PLATFORM_TYPE_ORCA: PlatformType = 1; // TODO: Add in another ticket. jkap 2/13/22
export const PLATFORM_TYPE_SABER: PlatformType = 2;
// export const PLATFORM_TYPE_MERCURIAL: PlatformType = 3; // TODO: Add in another ticket. jkap 2/13/22
export const PLATFORM_TYPE_UNKNOWN: PlatformType = 4;
