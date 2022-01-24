use anchor_lang::prelude::*;
use anchor_spl::token::{self,  Transfer, ID};

use crate::{
    instructions::*,
    constant::*,
    raydium::*,
    utils::*

};

pub fn process_withdraw_raydium_collateral(ctx: Context<WithdrawRaydiumCollateral>, amount: u64) -> ProgramResult {
    msg!("withdrawing ...");

    
    let mut _amount = amount;

    // integration with raydium staking program to withdraw lp

    // accounts for invoke raydium program instruction
    let mut raydium_accounts = Vec::with_capacity(17);
    raydium_accounts.push(AccountMeta::new(*ctx.accounts.raydium_pool_id.key, false));
    raydium_accounts.push(AccountMeta::new_readonly(*ctx.accounts.raydium_pool_authority.key, false));
    raydium_accounts.push(AccountMeta::new(*ctx.accounts.user_trove_associated_info_account.key, false));
    raydium_accounts.push(AccountMeta::new_readonly(*ctx.accounts.user_trove.key, true));
    raydium_accounts.push(AccountMeta::new(*ctx.accounts.pool_token_coll.key, false));
    raydium_accounts.push(AccountMeta::new(*ctx.accounts.raydium_pool_lp_account.key, false));
    raydium_accounts.push(AccountMeta::new(*ctx.accounts.user_trove_reward_token_a_account.key, false));
    raydium_accounts.push(AccountMeta::new(*ctx.accounts.raydium_pool_reward_token_a_account.key, false));
    raydium_accounts.push(AccountMeta::new_readonly(ctx.accounts.clock.key(), false));
    raydium_accounts.push(AccountMeta::new_readonly(ctx.accounts.token_program.key(), false));
    raydium_accounts.push(AccountMeta::new(*ctx.accounts.user_trove_reward_token_b_account.key, false));
    raydium_accounts.push(AccountMeta::new(*ctx.accounts.raydium_pool_reward_token_b_account.key, false));
    // raydium_accounts.push(AccountMeta::new(*ctx.accounts.pool_info_account_one.key, false));
    // raydium_accounts.push(AccountMeta::new(*ctx.accounts.pool_info_account_two.key, false));
    // raydium_accounts.push(AccountMeta::new(*ctx.accounts.pool_info_account_three.key, false));
    // raydium_accounts.push(AccountMeta::new(*ctx.accounts.pool_info_account_four.key, false));
    // raydium_accounts.push(AccountMeta::new(*ctx.accounts.pool_info_account_five.key, false));

    // AccountInfos for invoke_signed
    let account_infos = &[
        ctx.accounts.raydium_pool_id.clone(),
        ctx.accounts.raydium_pool_authority.clone(),
        ctx.accounts.user_trove_associated_info_account.clone(),
        ctx.accounts.user_trove.clone(),
        ctx.accounts.pool_token_coll.clone(),
        ctx.accounts.raydium_pool_lp_account.clone(),
        ctx.accounts.user_trove_reward_token_a_account.clone(),
        ctx.accounts.raydium_pool_reward_token_a_account.clone(),
        ctx.accounts.clock.to_account_info().clone(),
        ctx.accounts.token_program.to_account_info().clone(),
        ctx.accounts.pool_reward_token_b_account.clone(),
        ctx.accounts.raydium_pool_reward_token_b_account.clone(),
        // ctx.accounts.pool_info_account_one.clone(),
        // ctx.accounts.pool_info_account_two.clone(),
        // ctx.accounts.pool_info_account_three.clone(),
        // ctx.accounts.pool_info_account_four.clone(),
        // ctx.accounts.pool_info_account_five.clone()
    ];

    // raydium program address
    let raydium_program = ctx.accounts.raydium_program_id.clone();

    // instruction to invoke raydium program
    let instruction = Instruction {
        program_id: *raydium_program.key,
        accounts: raydium_accounts,
        data: Stake {
            instruction: 12,
            amount: amount
        }
        .to_vec()?,
    };

    // seed of token_vault account to sign the transaction
    let signer_seeds = &[
        USER_TROVE_TAG,
        ctx.accounts.token_vault.key().as_ref(),
        ctx.accounts.owner.key().as_ref(),
        &[ctx.accounts.user_trove.user_trove_nonce]
    ];
    let signer = &[&signer_seeds[..]];

    // invoke the raydium program
    invoke_signed(&instruction, account_infos, signer)?;

    // now lp tokens is withdrawed from raydium to token vault

    if amount > ctx.accounts.user_trove.locked_coll_balance {
        _amount = ctx.accounts.user_trove.locked_coll_balance;
    }
    
    // transfer from pool to user
    let cpi_accounts = Transfer {
        from: ctx.accounts.pool_token_coll.to_account_info(),
        to: ctx.accounts.user_token_coll.to_account_info(),
        authority: ctx.accounts.user_trove.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let signer_seeds = &[
        USER_TROVE_TAG,
        ctx.accounts.token_vault.to_account_info().key.as_ref(), 
        ctx.accounts.owner.to_account_info().key.as_ref(),
        &[ctx.accounts.user_trove.user_trove_nonce],
    ];
    let signer = &[&signer_seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    msg!("transfering ...");
    token::transfer(cpi_ctx, _amount)?;

    msg!("updating ...");
    ctx.accounts.token_vault.total_coll -= amount;
    ctx.accounts.user_trove.locked_coll_balance -= _amount;

    // transfer harvested tokens to user
    
    let cpi_token_program = ctx.accounts.token_program.to_account_info();

    // reward a token to user
    let reward_a_amount = get_token_balance(&ctx.accounts.user_trove_reward_token_a_account)?;

    if reward_a_amount > 0 {
        // transfer reward from pool to user
        let cpi_reward_accounts = Transfer {
            from: ctx.accounts.user_trove_reward_token_a_account.to_account_info(),
            to: ctx.accounts.user_reward_token_a_account.to_account_info(),
            authority: ctx.accounts.user_trove.to_account_info(),
        };

        let cpi_reward_a_ctx = CpiContext::new_with_signer(cpi_token_program, cpi_reward_accounts, signer);
        msg!("transfering reward ...");
        token::transfer(cpi_reward_a_ctx, reward_a_amount)?;
    }

    // let reward_b_amount = get_token_balance(&ctx.accounts.user_trove_reward_token_b_account)?;

    // if reward_b_amount > 0 {
    //     // transfer reward from pool to user
    //     let cpi_reward_accounts = Transfer {
    //         from: ctx.accounts.user_trove_reward_token_b_account.to_account_info(),
    //         to: ctx.accounts.user_reward_token_b_account.to_account_info(),
    //         authority: ctx.accounts.user_trove.to_account_info(),
    //     };
    //     let cpi_reward_b_ctx = CpiContext::new_with_signer(cpi_token_program, cpi_reward_accounts, signer);
    //     msg!("transfering reward dual ...");
    //     token::transfer(cpi_reward_b_ctx, reward_b_amount)?;
    // }
    

    Ok(())
}
