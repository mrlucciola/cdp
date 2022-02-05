use anchor_lang::prelude::*;
// use anchor_spl::token::{self,  Transfer, ID};

use crate::{
    instructions::*,
    utils::stake_to_saber,
};

pub fn process_stake_to_saber(
    ctx: Context<StakeToSaber>, 
    amount: u64, 
    token_vault_nonce: u8, 
    user_trove_nonce: u8, 
    token_coll_nonce: u8
) -> ProgramResult {
    
    let user_authority = ctx.accounts.user_trove.to_account_info();

    stake_to_saber(
        ctx.accounts.saber_farm_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.owner.to_account_info(),
        user_authority.clone(),
        &ctx.accounts.saber_farm,
        ctx.accounts.user_token_coll.to_account_info(),
        ctx.accounts.saber_farm_rewarder.to_account_info(),
        user_trove_nonce,
        amount,
    )?;

    ctx.accounts.token_vault.total_coll += amount;
    ctx.accounts.user_trove.locked_coll_balance += amount;

    Ok(())
}
