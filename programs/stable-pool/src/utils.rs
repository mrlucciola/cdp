use anchor_lang::prelude::*;
use crate::{
    constant::*,
    error::*,
};
use std::convert::TryInto;
use std::convert::TryFrom;
use spl_math::{precise_number::PreciseNumber};

pub fn get_market_price()->u64 {
    253
}


pub fn assert_debt_allowed(locked_coll_balance: u64, user_debt: u64, amount: u64)-> ProgramResult{
    let market_price = get_market_price();
    let debt_limit = market_price * locked_coll_balance;
    if debt_limit < user_debt + amount {
        return Err(StablePoolError::NotAllowed.into())
    }
    Ok(())
}

pub fn assert_limit_mint(cur_timestamp: u64, last_mint_time: u64)-> ProgramResult{
    if cur_timestamp < last_mint_time + LIMIT_MINT_TIME {
        return Err(StablePoolError::NotAllowed.into())
    }
    Ok(())
}