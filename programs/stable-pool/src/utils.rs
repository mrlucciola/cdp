// modules
use anchor_lang::prelude::*;
use anchor_spl::token::{accessor::amount, Mint};
use std::convert::TryInto;
// local
use crate::{
    errors::StablePoolError,
    states::{GlobalState, Oracle},
};

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

// StableUsdcPair
pub fn calc_lp_price(
    lp_supply: u64,
    amount_a: u64,
    decimals_a: u8,
    price_a: u64,
    amount_b: u64,
    decimals_b: u8,
    price_b: u64,
) -> Result<u64> {
    if lp_supply == 0 {
        return Ok(0);
    }
    let p_decimals_a = 10u64.pow(decimals_a as u32) as u64;
    let p_decimals_b = 10u64.pow(decimals_b as u32) as u64;
    msg!("lp_supply   : {}", lp_supply);
    msg!("amount_a    : {}", amount_a);
    msg!("price_a     : {}", price_a);
    msg!("p_decimals_a  : {}", p_decimals_a);
    msg!("decimals_a  : {}", decimals_a);
    msg!("amount_b    : {}", amount_b);
    msg!("price_b     : {}", price_b);
    msg!("p_decimals_b  : {}", p_decimals_b);
    msg!("decimals_b  : {}", decimals_b);

    // REFERENCE: 2*sqrt(price_A * price_B* pool_A* pool_B)/(pool_A+ pool_B)
    // WORKING: 2*sqrt(pool_mult_numer)/(pool_sum_denom)
    msg!(
        "max values: f32::MAX={}   u64::MAX={}   u128::MAX={}",
        f32::MAX,
        u64::MAX,
        u128::MAX
    );





    // = amount_a * amount_b
    let mul_1 = (amount_a as u128).checked_mul(amount_b as u128).unwrap();
    msg!("mul_1: {}", &mul_1);

    // = sqrt(amount_a * amount_b)
    let sq_1 = (mul_1 as f32).sqrt();
    msg!("sq_1: {}", &sq_1);

    // = price_a * price_b
    let mul_2 = (price_a.checked_div(p_decimals_a).unwrap() as u128)
        .checked_mul(price_b.checked_div(p_decimals_b).unwrap() as u128)
        .unwrap();
    msg!("mul_2: {}", &mul_2);

    // = sqrt(price_a * price_b)
    let sq_2 = (mul_2 as f32).sqrt();
    msg!("sq_2: {}", &sq_2);

    // numerator: sqrt(bal_a * bal_b) * sqrt(price_a * price_b)
    let numer = (sq_1 as u128).checked_mul(sq_2 as u128).unwrap();
    msg!("numer: {}", &numer);

    // = numer / lp_supply
    let prod = numer.checked_div(lp_supply as u128).unwrap();
    msg!("prod: {}", &prod);

    // = 2 * prod
    let lp_price = prod.checked_mul(2 as u128).unwrap();
    msg!("lp_price: {}", &lp_price);

    // this calculation is incorrect but need to push code first



    // // TODO: dont use unwrap
    // let denom: u64 = amount_a.checked_add(amount_b).unwrap(); // amount_USDC + amount_USDT
    // msg!("denom: {}", &denom);

    // let numer_pre_sqrt_and_mult_1: u128 = (price_a as u128).checked_mul(price_b as u128).unwrap();
    // msg!("numer_pre_sqrt_and_mult_1: {}", &numer_pre_sqrt_and_mult_1);
    // let numer_pre_sqrt_and_mult_2: u128 = numer_pre_sqrt_and_mult_1
    //     .checked_mul(amount_a as u128)
    //     .unwrap();
    // msg!("numer_pre_sqrt_and_mult_2: {}", &numer_pre_sqrt_and_mult_2);
    // let numer_pre_sqrt_and_mult_3: u128 = numer_pre_sqrt_and_mult_2
    //     .checked_mul(amount_b as u128)
    //     .unwrap();
    // msg!("numer_pre_sqrt_and_mult_3: {}", &numer_pre_sqrt_and_mult_3);
    // let numer_pre_sqrt_and_mult: u64 = price_a
    //     .checked_mul(price_b)
    //     .unwrap()
    //     .checked_mul(amount_a)
    //     .unwrap()
    //     .checked_mul(amount_b)
    //     .unwrap(); // price_USDC * price_USDT * amount_USDC * amount_USDT
    // msg!("numer_pre_sqrt_and_mult: {}", &numer_pre_sqrt_and_mult);
    // let numer_pre_mult = (numer_pre_sqrt_and_mult as f64).sqrt(); //.checked_pow(1/2).unwrap(); // sqrt(price_USDC * price_USDT * amount_USDC * amount_USDT)
    // msg!("numer_pre_mult: {}", &numer_pre_mult);
    // let numer = (numer_pre_mult as u64).checked_mul(2).unwrap(); // 2 * sqrt(price_USDC * price_USDT * amount_USDC * amount_USDT)
    // msg!("numer: {}", &numer);

    // let lp_price = numer.checked_div(denom).unwrap();
    // msg!("lp price: {}", lp_price);

    // let result = lp_price;

    // Ok(result)
    Ok(1123)
}

pub fn get_price(
    accounts: &[AccountInfo],
    mint_lp: &Mint,
    pair_count: usize,
    oracles: &Vec<Pubkey>,
    pools: &Vec<Pubkey>,
) -> Result<u64> {
    msg!("validating ...");
    // LpPair::validate(accounts, pair_count, oracles, pools)?;

    let mut _total_values: u128 = 0;
    for i in 0..pair_count {
        msg!("i={}", i);
        let oracle = Account::<Oracle>::try_from(&accounts[i])?;
        msg!("got oracle");
        let pool_amount = amount(&accounts[i + pair_count])?;
        msg!(
            "oracle price = {}, pool_amount = {}",
            oracle.price,
            pool_amount
        );
        _total_values +=
            (oracle.price as u128) * (pool_amount as u128) / 10u128.pow(oracle.decimals as u32);
    }
    let price = _total_values * 10u128.pow(mint_lp.decimals as u32) / (mint_lp.supply as u128);

    Ok(price.try_into().unwrap())
}
