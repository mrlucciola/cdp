use crate::{constant::*, error::*, pyth, pyth::*, states::GlobalState};
use anchor_lang::prelude::*;
use arrayref::{array_mut_ref, array_ref, mut_array_refs};
use spl_math::precise_number::PreciseNumber;
use std::convert::TryFrom;
use std::convert::TryInto;

pub fn get_market_price_devnet(risk_level: u8) -> u64 {
    return 10_000_000_000;
}
pub fn assert_debt_allowed(
    locked_coll_balance: u64,
    user_debt: u64,
    amount: u64,
    risk_level: u8,
) -> ProgramResult {
    let market_price = get_market_price_devnet(risk_level);
    let debt_limit = market_price * locked_coll_balance / 100_000_000_000;

    if debt_limit < user_debt + amount {
        return Err(StablePoolError::NotAllowed.into());
    }
    Ok(())
}

pub fn assert_limit_mint(cur_timestamp: u64, last_mint_time: u64) -> ProgramResult {
    if cur_timestamp < last_mint_time + LIMIT_MINT_TIME {
        return Err(StablePoolError::NotAllowed.into());
    }
    Ok(())
}

pub fn assert_tvl_allowed(tvl_limit: u64, tvl: u64, amount: u64) -> ProgramResult {
    if tvl_limit < tvl + amount {
        return Err(StablePoolError::TVLExceeded.into());
    }
    Ok(())
}
pub fn assert_pda(seeds: &[&[u8]], program_id: &Pubkey, goal_key: &Pubkey) -> ProgramResult {
    let (found_key, _bump) = Pubkey::find_program_address(seeds, program_id);
    if found_key != *goal_key {
        return Err(StablePoolError::InvalidProgramAddress.into());
    }
    Ok(())
}
pub fn get_token_balance(token_account: &AccountInfo) -> Result<u64> {
    let data = token_account.try_borrow_data()?;
    let amount = array_ref![data, 64, 8];

    Ok(u64::from_le_bytes(*amount))
}

// modifier
pub fn paused<'info>(global_state: &Account<GlobalState>) -> Result<()> {
    require!(global_state.paused == 0, StablePoolError::NotAllowed);
    Ok(())
}

pub fn assert_global_debt_ceiling_not_exceeded(
    debt_ceiling: u64,
    total_debt: u64,
    amount: u64,
) -> ProgramResult {
    // Debt ceiling of 0 means unlimited
    if debt_ceiling == 0 {
        return Ok(());
    }
    if debt_ceiling < total_debt + amount {
        return Err(StablePoolError::GlobalDebtCeilingExceeded.into());
    }
    Ok(())
}

pub fn assert_vault_debt_ceiling_not_exceeded(
    debt_ceiling: u64,
    total_debt: u64,
    amount: u64,
) -> ProgramResult {
    // Debt ceiling of 0 means unlimited
    if debt_ceiling == 0 {
        return Ok(());
    }
    if debt_ceiling < total_debt + amount {
        return Err(StablePoolError::VaultDebtCeilingExceeded.into());
    }
    Ok(())
}

pub fn assert_devnet() -> ProgramResult {
    if !DEVNET_MODE {
        return Err(StablePoolError::InvalidCluster.into());
    }
    Ok(())
}
