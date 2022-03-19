// modules
use anchor_lang::prelude::*;
use std::convert::TryInto;
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



//StableUsdcPair
pub fn calc_lp_price(
    p_lp_supply: u64,
    p_amount_a: u64,
    p_decimals_a: u8,
    p_price_a: u64,
    p_amount_b: u64,
    p_decimals_b: u8,
    p_price_b: u64,
) -> Result<u64> {
    if p_lp_supply == 0 {
        return Ok(0);
    }
    let amount_a = p_amount_a as u128;
    let decimals_a = 10u64.pow(p_decimals_a as u32) as u128;
    let amount_b = p_amount_b as u128;
    let decimals_b = 10u64.pow(p_decimals_b as u32) as u128;
    let supply = p_lp_supply as u128;

    let price_a = p_price_a as u128;
    let price_b = p_price_b as u128;
    
    let lp_price = amount_a //decimals_a
        .checked_mul(price_a) //price-decimals
        .unwrap()
        .checked_div(decimals_a)
        .unwrap()
        .checked_add(
            amount_b //decimals_a
            .checked_mul(price_b) //price-decimals
            .unwrap()
            .checked_div(decimals_b)
            .unwrap()
        )
        .unwrap()
        .checked_div(supply)
        .unwrap();
    let result: u64 = lp_price.try_into().unwrap();
    return Ok(result);
}
pub fn pda_bump(seeds: &[&[u8]]) -> u8 {
    let program_id = crate::ID;
    let (_found_key, bump) = Pubkey::find_program_address(seeds, &program_id);
    bump
}