// modules
use anchor_lang::prelude::*;
// local
use crate::{errors::StablePoolError, states::GlobalState};

pub fn assert_tvl_allowed(tvl_limit: u64, tvl: u64, amount: u64) -> Result<()> {
    if tvl_limit < tvl + amount {
        return Err(StablePoolError::TVLExceeded.into());
    }
    Ok(())
}

pub fn is_global_state_paused(global_state: &Account<GlobalState>) -> Result<()> {
    require!(global_state.paused == 0, StablePoolError::NotAllowed);
    Ok(())
}
