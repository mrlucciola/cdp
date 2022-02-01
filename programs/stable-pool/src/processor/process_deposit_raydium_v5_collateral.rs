use crate::{constant::*, instructions::*, raydium::*, utils::*};
use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::{AccountMeta, Instruction},
        program::invoke_signed,
    },
};
use anchor_spl::token::{self, Transfer, ID};

pub fn process_deposit_raydium_v5_collateral(
    ctx: Context<DepositRaydiumV5Collateral>,
    amount: u64,
) -> ProgramResult {
    assert_pda(
        &[USER_TROVE_POOL_TAG, ctx.accounts.user_trove.key().as_ref()],
        ctx.program_id,
        ctx.accounts.user_trove_token_coll.key,
    )?;

    // transfer from user to pool
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_coll.clone(),
        to: ctx.accounts.user_trove_token_coll.clone(),
        authority: ctx.accounts.owner.to_account_info().clone(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;

    ctx.accounts.token_vault.total_coll += amount;
    ctx.accounts.user_trove.locked_coll_balance += amount;

    // seed of token_vault account to sign the transaction
    let signer_seeds = &[
        USER_TROVE_TAG,
        ctx.accounts.token_vault.to_account_info().key.as_ref(),
        ctx.accounts.owner.to_account_info().key.as_ref(),
        &[ctx.accounts.user_trove.user_trove_nonce],
    ];
    let signer = &[&signer_seeds[..]];

    //raydium deposit

    let mut raydium_accounts = Vec::with_capacity(17);
    raydium_accounts.push(AccountMeta::new(*ctx.accounts.raydium_pool_id.key, false));
    raydium_accounts.push(AccountMeta::new_readonly(
        *ctx.accounts.raydium_pool_authority.key,
        false,
    ));
    raydium_accounts.push(AccountMeta::new(
        *ctx.accounts.user_trove_associated_info_account.key,
        false,
    ));
    raydium_accounts.push(AccountMeta::new_readonly(
        ctx.accounts.user_trove.key(),
        true,
    ));
    raydium_accounts.push(AccountMeta::new(
        *ctx.accounts.user_trove_token_coll.key,
        false,
    ));
    raydium_accounts.push(AccountMeta::new(
        *ctx.accounts.raydium_pool_lp_account.key,
        false,
    ));
    raydium_accounts.push(AccountMeta::new(
        ctx.accounts.user_trove_reward_token_a.key(),
        false,
    ));
    raydium_accounts.push(AccountMeta::new(
        *ctx.accounts.raydium_pool_reward_token_a_account.key,
        false,
    ));
    raydium_accounts.push(AccountMeta::new_readonly(*ctx.accounts.clock.key, false));
    raydium_accounts.push(AccountMeta::new_readonly(
        ctx.accounts.token_program.key(),
        false,
    ));
    raydium_accounts.push(AccountMeta::new(
        ctx.accounts.user_trove_reward_token_b.key(),
        false,
    ));
    raydium_accounts.push(AccountMeta::new(
        *ctx.accounts.raydium_pool_reward_token_b_account.key,
        false,
    ));

    // AccountInfos for invoke_signed
    let account_infos = &[
        ctx.accounts.raydium_pool_id.clone(),
        ctx.accounts.raydium_pool_authority.clone(),
        ctx.accounts.user_trove_associated_info_account.clone(),
        ctx.accounts.user_trove.to_account_info(),
        ctx.accounts.user_trove_token_coll.clone(),
        ctx.accounts.raydium_pool_lp_account.clone(),
        ctx.accounts.user_trove_reward_token_a.to_account_info(),
        ctx.accounts.raydium_pool_reward_token_a_account.clone(),
        ctx.accounts.clock.clone(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.user_trove_reward_token_b.to_account_info(),
        ctx.accounts.raydium_pool_reward_token_b_account.clone(),
    ];

    // raydium program address
    let raydium_program = ctx.accounts.raydium_program_id.clone();

    // instruction to invoke raydium program
    let instruction = Instruction {
        program_id: *raydium_program.key,
        accounts: raydium_accounts,
        data: Stake {
            instruction: 11,
            amount: amount,
        }
        .to_vec()?,
    };

    // invoke the raydium program
    invoke_signed(&instruction, account_infos, signer)?;

    // now lp tokens is sent from token vault to raydium

    // reward a token to user
    let reward_a_amount =
        get_token_balance(&ctx.accounts.user_trove_reward_token_a.to_account_info())?;

    if reward_a_amount > 0 {
        // transfer reward from pool to user
        let cpi_reward_accounts = Transfer {
            from: ctx.accounts.user_trove_reward_token_a.to_account_info(),
            to: ctx.accounts.user_reward_token_a_account.to_account_info(),
            authority: ctx.accounts.user_trove.to_account_info(),
        };
        let cpi_token_program = ctx.accounts.token_program.to_account_info();
        let cpi_reward_a_ctx =
            CpiContext::new_with_signer(cpi_token_program, cpi_reward_accounts, signer);
        msg!("transfering reward ...");
        token::transfer(cpi_reward_a_ctx, reward_a_amount)?;
    }

    let reward_b_amount =
        get_token_balance(&ctx.accounts.user_trove_reward_token_b.to_account_info())?;

    if reward_b_amount > 0 {
        // transfer reward from pool to user
        let cpi_reward_accounts = Transfer {
            from: ctx.accounts.user_trove_reward_token_b.to_account_info(),
            to: ctx.accounts.user_reward_token_b_account.to_account_info(),
            authority: ctx.accounts.user_trove.to_account_info(),
        };
        let cpi_token_program = ctx.accounts.token_program.to_account_info();
        let cpi_reward_b_ctx =
            CpiContext::new_with_signer(cpi_token_program, cpi_reward_accounts, signer);
        msg!("transfering reward dual ...");
        token::transfer(cpi_reward_b_ctx, reward_b_amount)?;
    }

    Ok(())
}
