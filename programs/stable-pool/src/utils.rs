// modules
use anchor_lang::prelude::*;
use arrayref::array_ref;

// use std::convert::TryInto;
// use std::convert::TryFrom;
// use spl_math::{precise_number::PreciseNumber};

use quarry_mine::cpi::{
    withdraw_tokens, 
    claim_rewards,
    stake_tokens,
    accounts::{
        UserStake, 
        UserClaim,
        ClaimRewards, 
    }
};
use solana_program::{
    program::{ invoke, invoke_signed },
    instruction::Instruction
};

use std::convert::TryInto;
// local
use crate::{constant::*, error::*, instructions::SaberFarm, states::GlobalState};

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

pub fn stake_to_saber_pda<'info>(
    farm_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,

    user_authority: AccountInfo<'info>,

    farm: &SaberFarm<'info>,

    token_account: AccountInfo<'info>,
    rewarder: AccountInfo<'info>,

    amount: u64,
    authority_seeds: &[&[u8]],
) -> ProgramResult {
    stake_tokens(
        CpiContext::new(
            farm_program,
            UserStake {
                authority: user_authority,
                miner: farm.miner.to_account_info(),
                quarry: farm.quarry.to_account_info(),
                miner_vault: farm.miner_vault.to_account_info(),
                token_account: token_account.clone(),
                token_program: token_program.clone(),
                rewarder,
            },
        )
        .with_signer(&[&authority_seeds[..]]),
        amount,
    )?;

    Ok(())
}
pub fn unstake_from_saber_pda<'info>(
    farm_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,

    authority: AccountInfo<'info>,

    farm: &SaberFarm<'info>,

    token_account: AccountInfo<'info>,
    rewarder: AccountInfo<'info>,

    amount: u64,
    authority_seeds: &[&[u8]],
) -> ProgramResult {
    withdraw_tokens(
        CpiContext::new(
            farm_program,
            UserStake {
                authority: authority,
                miner: farm.miner.to_account_info(),
                quarry: farm.quarry.to_account_info(),
                miner_vault: farm.miner_vault.to_account_info(),
                token_account: token_account.clone(),
                token_program: token_program.clone(),
                rewarder,
            },
        )
        .with_signer(&[&authority_seeds[..]]),
        amount,
    )?;

    Ok(())
}

pub struct ProcessedAmounts {
    pub owner_fee: u64,
    pub new_amount: u64,
}

pub fn calculate_fee(
    input_amount: u64,
    fee_pct: u128,
)->Result<ProcessedAmounts>{
    let mut fee_amount = u128::from(input_amount).checked_mul(fee_pct).unwrap()
    .checked_div(FEE_DENOMINATOR).unwrap();

    if fee_amount == 0 {
        fee_amount = 1;
    }

    let new_amount = u128::from(input_amount).checked_sub(fee_amount).unwrap();
    
    Ok(ProcessedAmounts{
        owner_fee: fee_amount.try_into().unwrap(),
        new_amount: new_amount.try_into().unwrap(),
    })
}


pub fn harvest_from_saber_pda<'info>(
    farm_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,

    authority: AccountInfo<'info>,
    reward_token: AccountInfo<'info>,
    token_account: AccountInfo<'info>,

    // harvest_accounts: &FarmHarvest<'info>,
    farm: &SaberFarm<'info>,

    rewarder: AccountInfo<'info>,

    mint_wrapper: AccountInfo<'info>,
    mint_wrapper_program: AccountInfo<'info>,
    minter: AccountInfo<'info>,
    rewards_token_mint: AccountInfo<'info>,
    claim_fee_token_account: AccountInfo<'info>,
    authority_seeds: &[&[u8]],
) -> ProgramResult {
    claim_rewards(
        CpiContext::new(
            farm_program,
            ClaimRewards {
                mint_wrapper: mint_wrapper.to_account_info(),
                mint_wrapper_program: mint_wrapper_program.to_account_info(),
                minter: minter.to_account_info(),
                rewards_token_mint: rewards_token_mint.to_account_info(),
                rewards_token_account: reward_token.clone(),
                claim_fee_token_account: claim_fee_token_account.to_account_info(),
                stake: UserClaim {
                    authority: authority.clone(),
                    miner: farm.miner.to_account_info(),
                    quarry: farm.quarry.to_account_info(),
                    unused_miner_vault: farm.miner_vault.to_account_info(),
                    unused_token_account: token_account,
                    token_program: token_program.clone(),
                    rewarder,
                },
            },
        )
        .with_signer(&[&authority_seeds[..]]),
    )?;

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

// orca lp integration
pub fn fn_cpi_invoke<'info, 'a>(
    accounts: &[AccountInfo<'info>], 
    cpi_program: AccountInfo<'info>,
    instruction: u8,
    amount: u64,
    is_pda_sign: bool,
    authority_signer_seeds: Option<&'a[&'a[u8]]>
) -> ProgramResult {
    let mut data: Vec<u8> = vec![];
    data.push(instruction);
    data.extend(amount.to_le_bytes().to_vec());
    
    // Getting AccountMeta Vector
    let accounts_metas: Vec<AccountMeta> 
        = accounts.iter().map(
            |acc| if acc.is_writable == true { AccountMeta::new(*acc.key, acc.is_signer)} 
                                else {AccountMeta::new_readonly(*acc.key, acc.is_signer)}
        )
        .collect();

    //msg!("metas: {:?}", &accounts_metas);
    // Constructing Instruction
    let instruction = Instruction {
        program_id: cpi_program.key(),
        data,
        accounts: accounts_metas
    };

    // Getting Accounts Vector
    let mut ix_accounts: Vec<AccountInfo> 
        = accounts.iter().map(|acc| acc.clone())
        .collect();

    ix_accounts.push(cpi_program.clone()); 

    //msg!("ix_accounts: {:?}", &ix_accounts[0]);
    // CPI Invoke
    if is_pda_sign {
        invoke_signed(
            &instruction,
            &ix_accounts,
            &[authority_signer_seeds.unwrap()]
        )?;
    } else {     
        invoke(
            &instruction,
            &ix_accounts
        )?;
    }
    Ok(())
}