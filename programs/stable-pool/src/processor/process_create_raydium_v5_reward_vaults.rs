use crate::{constant::*, instructions::*, raydium::*, utils::*};
use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::{AccountMeta, Instruction},
        program::invoke_signed,
    },
};
use anchor_spl::token::{self, Transfer, ID};

pub fn process_create_raydium_v5_reward_vaults(
    ctx: Context<CreateRaydiumV5RewardVaults>,
    user_trove_reward_token_a_nonce: u8,
    user_trove_reward_token_b_nonce: u8,
) -> ProgramResult {
    ctx.accounts.token_vault.reward_mint_a = ctx.accounts.reward_mint_a.key();
    ctx.accounts.token_vault.reward_mint_b = ctx.accounts.reward_mint_b.key();

    ctx.accounts.user_trove.user_trove_reward_token_a_nonce = user_trove_reward_token_a_nonce;
    ctx.accounts.user_trove.user_trove_reward_token_b_nonce = user_trove_reward_token_b_nonce;

    Ok(())
}
