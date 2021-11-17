///INITIAL_OWNER
pub const INITIAL_OWNER:&str = "";


pub const GLOBAL_STATE_TAG:&[u8] = b"golbal-state-seed";
pub const TOKEN_VAULT_TAG:&[u8] = b"token-vault-seed";
pub const USER_TROVE_TAG:&[u8] = b"user-trove-seed";

use std::env;
const CLUSTER: &str = env!("CLUSTER");

const LIMIT_MINT_USD_TIME:u64 = if CLUSTER == "devnet" {3600} else {0};