use crate::{constant::*, instructions::*, raydium::*, utils::*};
use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::{AccountMeta, Instruction},
        program::{invoke, invoke_signed},
        system_instruction,
    },
};
use anchor_spl::token::{self, Transfer, ID};

pub fn process_create_raydium_user_account(
    ctx: Context<CreateRaydiumUserAccount>,
    user_trove_nonce: u8,
) -> ProgramResult {
    if ctx
        .accounts
        .user_trove_associated_info_account
        .data_is_empty()
    {
        let required_lamports = ctx
            .accounts
            .rent
            .minimum_balance(RAYDIUM_USER_ACCOUNT_SIZE)
            .max(1)
            .saturating_sub(ctx.accounts.user_trove_associated_info_account.lamports());

        if required_lamports > 0 {
            msg!("Transfer {} lamports to the new account", required_lamports);
            invoke(
                &system_instruction::transfer(
                    &ctx.accounts.owner.key,
                    ctx.accounts.user_trove_associated_info_account.key,
                    required_lamports,
                ),
                &[
                    ctx.accounts.owner.to_account_info(),
                    ctx.accounts.user_trove_associated_info_account.clone(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        // seed of token_vault account to sign the transaction
        let signer_seeds = &[
            USER_TROVE_TAG,
            ctx.accounts.token_vault.to_account_info().key.as_ref(),
            ctx.accounts.owner.to_account_info().key.as_ref(),
            &[user_trove_nonce],
        ];
        let signer = &[&signer_seeds[..]];

        // create stake account for raydium
        if ctx
            .accounts
            .user_trove_associated_info_account
            .data_is_empty()
        {
            let mut raydium_accounts = Vec::with_capacity(5);
            raydium_accounts.push(AccountMeta::new(*ctx.accounts.raydium_pool_id.key, false));
            raydium_accounts.push(AccountMeta::new(
                *ctx.accounts.user_trove_associated_info_account.key,
                false,
            ));
            raydium_accounts.push(AccountMeta::new(ctx.accounts.user_trove.key(), true));
            raydium_accounts.push(AccountMeta::new_readonly(
                ctx.accounts.system_program.key(),
                false,
            ));
            raydium_accounts.push(AccountMeta::new_readonly(ctx.accounts.rent.key(), false));

            // AccountInfos for invoke_signed
            let account_infos = &[
                ctx.accounts.raydium_pool_id.clone(),
                ctx.accounts.user_trove_associated_info_account.clone(),
                ctx.accounts.user_trove.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ];

            // raydium program address
            let raydium_program = ctx.accounts.raydium_program_id.clone();

            // instruction to invoke raydium program
            let instruction = Instruction {
                program_id: *raydium_program.key,
                accounts: raydium_accounts,
                data: CreateLedgerAccount { instruction: 10 }.to_vec()?,
            };
            // invoke the raydium program
            invoke_signed(&instruction, account_infos, signer)?;
        }
    }
    Ok(())
}
