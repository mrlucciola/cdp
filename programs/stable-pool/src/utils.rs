// modules
use anchor_lang::prelude::*;
// local
use crate::{errors::StablePoolError, states::GlobalState};

pub fn assert_tvl_allowed(tvl_limit: u64, tvl: u64, amount: u64) -> Result<()> {
    let new_tvl = tvl.checked_add(amount).unwrap();
    if tvl_limit < new_tvl {
        return Err(StablePoolError::GlobalTVLExceeded.into());
    }
    Ok(())
}

pub fn is_global_state_paused(global_state: &Account<GlobalState>) -> Result<()> {
    require!(global_state.paused == 0, StablePoolError::NotAllowed);

    Ok(())
}

// StableUsdcPair
pub fn calc_lp_price(
    lp_supply: u64,
    amount_a: u64,
    price_a: u64,
    amount_b: u64,
    price_b: u64,
) -> Result<u64> {
    if lp_supply == 0 {
        return Ok(0);
    }

    // = amount_a * amount_b
    let mul_1 = (amount_a as u128).checked_mul(amount_b as u128).unwrap();
    // = sqrt(amount_a * amount_b)
    let sq_1 = (mul_1 as f32).sqrt();

    // = price_a * price_b
    let mul_2 = (price_a as u128).checked_mul(price_b as u128).unwrap();
    // = sqrt(price_a * price_b)
    let sq_2 = (mul_2 as f32).sqrt();

    // numerator: sqrt(bal_a * bal_b) * sqrt(price_a * price_b)
    let numer = (sq_1 as u128).checked_mul(sq_2 as u128).unwrap();
    // = numer / lp_supply
    let prod = numer.checked_div(lp_supply as u128).unwrap();
    // = 2 * prod
    let lp_price = (prod as u128).checked_mul(2).unwrap();

    Ok(lp_price as u64)
}
