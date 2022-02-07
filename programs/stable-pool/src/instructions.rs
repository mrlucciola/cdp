use anchor_lang::prelude::*;
use quarry_mine::Rewarder;
// local
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Token, TokenAccount, Mint}
};

use crate::{
    states::*,
    constant::*,
    site_fee_owner
};

#[derive(Accounts)]
#[instruction(global_state_nonce:u8, mint_usd_nonce:u8, tvl_limit:u64, debt_ceiling:u64)]
pub struct CreateGlobalState<'info>{
    #[account(mut)]
    pub super_owner: Signer<'info>,

    #[account(
        init,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state_nonce,
        payer = super_owner,
        )]
    pub global_state: Account<'info, GlobalState>,

    #[account(init,
        mint::decimals = USD_DECIMALS,
        mint::authority = global_state,
        seeds = [USD_MINT_TAG],
        bump = mint_usd_nonce,
        payer = super_owner)]
    pub mint_usd: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct SetHarvestFee<'info>{
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce,
    )]
    pub global_state: Account<'info, GlobalState>,
}

#[derive(Accounts)]
pub struct ToggleEmerState<'info>{
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce,
    )]
    pub global_state: Account<'info, GlobalState>,
}

#[derive(Accounts)]
pub struct ChangeSuperOwner<'info>{
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce,
    )]
    pub global_state: Account<'info, GlobalState>,
    pub new_owner: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(token_vault_nonce:u8, risk_level: u8, is_dual: u8, debt_ceiling: u64)]
pub struct CreateTokenVault<'info> {
    #[account(mut)]
    pub payer:  Signer<'info>,

    #[account(
        init,
        seeds = [TOKEN_VAULT_TAG,mint_coll.key().as_ref()],
        bump = token_vault_nonce,
        payer = payer,
        constraint = payer.key() == global_state.super_owner)]
    pub token_vault: Account<'info, TokenVault>,

    #[account(mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce)]
    pub global_state: Account<'info, GlobalState>,

    pub mint_coll:Account<'info, Mint>,

    pub reward_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(user_trove_nonce: u8)]
pub struct CreateRaydiumUserAccount<'info> {
    pub owner:  Signer<'info>,
    #[account(mut,
        seeds = [USER_TROVE_TAG,token_vault.key().as_ref(), owner.key().as_ref()],
        bump = user_trove_nonce,
    )]
    pub user_trove:AccountInfo<'info>,
    #[account(mut,
        seeds = [TOKEN_VAULT_TAG,token_vault.mint_coll.as_ref()],
        bump = token_vault.token_vault_nonce
    )]
    pub token_vault:Account<'info, TokenVault>,

    pub raydium_program_id: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_pool_id: AccountInfo<'info>,
    #[account(mut)]
    pub user_trove_associated_info_account: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(user_trove_nonce:u8, token_coll_nonce:u8, reward_vault_bump: u8)]
pub struct CreateUserTrove<'info> {

    #[account(mut,
        seeds = [TOKEN_VAULT_TAG, mint_coll.key().as_ref()],
        bump = token_vault.token_vault_nonce,
    )]
    pub token_vault:Account<'info, TokenVault>,

    #[account(
        init_if_needed,
        seeds = [USER_TROVE_TAG,token_vault.key().as_ref(), authority.key().as_ref()],
        bump = user_trove_nonce,
        payer = authority,
    )]
    pub user_trove:Account<'info, UserTrove>,

    pub authority: Signer<'info>,

    #[account(init_if_needed,
        token::mint = mint_coll,
        token::authority = user_trove,
        seeds = [
            USER_TROVE_POOL_TAG, 
            user_trove.key().as_ref(),
            mint_coll.key().as_ref(),
        ],
        bump = token_coll_nonce,
        payer = authority)]
    pub token_coll:Account<'info, TokenAccount>,

    #[account(mut,
        constraint = mint_coll.key() == token_vault.mint_coll)]
    pub mint_coll: Account<'info, Mint>,

    #[account(init,
        token::mint = reward_mint,
        token::authority = user_trove,
        seeds = [
            USER_TROVE_POOL_TAG, 
            user_trove.key().as_ref(), 
            reward_mint.key().key().as_ref()
        ],
        bump = reward_vault_bump,
        payer = authority)]
    pub reward_vault:Account<'info, TokenAccount>,
    
    #[account(constraint = reward_mint.key() == token_vault.reward_mint)]
    pub reward_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct RatioStaker<'info> {
    
    #[account(mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut,
        seeds = [TOKEN_VAULT_TAG,mint_coll.key().as_ref()],
        bump = token_vault.token_vault_nonce,
    )]
    pub token_vault:Account<'info, TokenVault>,

    #[account(mut,
        seeds = [
            USER_TROVE_TAG,
            token_vault.key().as_ref(), 
            owner.key().as_ref()
        ],
        bump = user_trove.user_trove_nonce)]
    pub user_trove:Account<'info, UserTrove>,

    pub owner:  Signer<'info>,

    #[account(mut,
        seeds = [
            USER_TROVE_POOL_TAG, 
            user_trove.key().as_ref(), 
            token_vault.mint_coll.as_ref()
        ],
        bump = user_trove.token_coll_nonce,
    )]
    pub pool_token_coll:Account<'info, TokenAccount>,

    #[account(mut,
        constraint = user_token_coll.owner == owner.key(),
        constraint = user_token_coll.mint == token_vault.mint_coll)]
    pub user_token_coll: Account<'info, TokenAccount>,

    #[account(mut, constraint = mint_coll.key() == token_vault.mint_coll)]
    pub mint_coll:Account<'info, Mint>,

    pub token_program:Program<'info, Token>,
}

#[derive(Accounts)]
pub struct HarvestReward<'info> {

    #[account(mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut,
        seeds = [TOKEN_VAULT_TAG, collateral_mint.key().as_ref()],
        bump = token_vault.token_vault_nonce,
    )]
    pub token_vault:Account<'info, TokenVault>,

    #[account(mut,
        seeds = [USER_TROVE_TAG,token_vault.key().as_ref(), authority.key().as_ref()],
        bump = user_trove.user_trove_nonce)]
    pub user_trove:Account<'info, UserTrove>,

    pub authority: Signer<'info>,

    #[account(mut, constraint = user_trove_reward.owner == user_trove.key())]
    pub user_trove_reward:Box<Account<'info, TokenAccount>>,

    #[account(mut,
        constraint = user_reward_token.owner == authority.key(),
        constraint = user_reward_token.mint == token_vault.reward_mint)]
    pub user_reward_token: Box<Account<'info, TokenAccount>>,

    #[account(mut, 
        constraint = reward_fee_token.owner == site_fee_owner::ID,
        constraint = reward_fee_token.mint == token_vault.reward_mint,
    )]
    pub reward_fee_token:Box<Account<'info, TokenAccount>>,

    #[account(constraint = collateral_mint.key() == token_vault.mint_coll)]
    pub collateral_mint: Box<Account<'info, Mint>>,

    pub system_program: Program<'info, System>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,

    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(amount: u64, user_usd_token_nonce: u8)]
pub struct BorrowUsd<'info> {
    #[account(mut)]
    pub owner:  Signer<'info>,
    
    #[account(mut,
        seeds = [TOKEN_VAULT_TAG,mint_coll.key().as_ref()],
        bump = token_vault.token_vault_nonce,
    )]
    pub token_vault:Account<'info, TokenVault>,
    #[account(mut,
        seeds = [USER_TROVE_TAG,token_vault.key().as_ref(), owner.key().as_ref()],
        bump = user_trove.user_trove_nonce)]
    pub user_trove:Account<'info, UserTrove>,
    
    #[account(mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut,
        seeds = [USD_MINT_TAG],
        bump = global_state.mint_usd_nonce,
        constraint = mint_usd.key() == global_state.mint_usd
    )]
    pub mint_usd:Account<'info, Mint>,
    #[account(init_if_needed,
        token::mint = mint_usd,
        token::authority = owner,
        seeds = [
            USER_USD_TOKEN_TAG, 
            owner.key().as_ref(), 
            mint_usd.key().as_ref()
        ],
        bump = user_usd_token_nonce,
        payer = owner)]
    pub user_token_usd: Account<'info, TokenAccount>,

    #[account(mut,
        constraint = mint_coll.key() == token_vault.mint_coll)]
    pub mint_coll:Account<'info, Mint>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>,

    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct RepayUsd<'info> {
    pub owner:  Signer<'info>,
    #[account(mut,
        seeds = [TOKEN_VAULT_TAG,mint_coll.key().as_ref()],
        bump = token_vault.token_vault_nonce,
    )]
    pub token_vault:Account<'info, TokenVault>,

    #[account(mut,
        seeds = [USER_TROVE_TAG,token_vault.key().as_ref(), owner.key().as_ref()],
        bump = user_trove.user_trove_nonce)]
    pub user_trove:Account<'info, UserTrove>,

    #[account(mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut,
        seeds = [USD_MINT_TAG],
        bump = global_state.mint_usd_nonce,
        constraint = mint_usd.key() == global_state.mint_usd
    )]
    pub mint_usd:Account<'info, Mint>,
    
    #[account(mut)]
    pub user_token_usd:Account<'info, TokenAccount>,

    #[account(mut,
        constraint = mint_coll.key() == token_vault.mint_coll)]
    pub mint_coll:Account<'info, Mint>,
    
    pub token_program:Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(user_trove_reward_token_a_nonce: u8, user_trove_reward_token_b_nonce: u8)]
pub struct CreateRaydiumV5RewardVaults<'info> {
    pub owner:  Signer<'info>,
    #[account(mut,
        seeds = [USER_TROVE_TAG,token_vault.key().as_ref(), owner.key().as_ref()],
        bump = user_trove.user_trove_nonce,
    )]
    pub user_trove:Account<'info, UserTrove>,
    #[account(mut,
        seeds = [TOKEN_VAULT_TAG,token_vault.mint_coll.as_ref()],
        bump = token_vault.token_vault_nonce,
    )]
    pub token_vault:Account<'info, TokenVault>,

    pub reward_mint_a:Account<'info, Mint>,

    #[account(
        init_if_needed,
        token::mint = reward_mint_a,
        token::authority = user_trove,
        seeds = [
            USER_TROVE_REWARD_A_TAG, 
            user_trove.key().as_ref(), 
        ],
        bump = user_trove_reward_token_a_nonce,
        payer = owner
    )]
    pub user_trove_reward_token_a: Account<'info, TokenAccount>,

    pub reward_mint_b:Account<'info, Mint>,

    #[account(
        init_if_needed,
        token::mint = reward_mint_b,
        token::authority = user_trove,
        seeds = [
            USER_TROVE_REWARD_B_TAG, 
            user_trove.key().as_ref(), 
        ],
        bump = user_trove_reward_token_b_nonce,
        payer = owner
    )]
    pub user_trove_reward_token_b: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositRaydiumV5Collateral<'info> {
    pub owner:  Signer<'info>,
    #[account(mut,
        seeds = [USER_TROVE_TAG,token_vault.key().as_ref(), owner.key().as_ref()],
        bump = user_trove.user_trove_nonce,
    )]
    pub user_trove:Account<'info, UserTrove>,
    #[account(mut,
        seeds = [TOKEN_VAULT_TAG,token_vault.mint_coll.as_ref()],
        bump = token_vault.token_vault_nonce,
    )]
    pub token_vault:Account<'info, TokenVault>,
    #[account(mut)]
    pub user_trove_token_coll: AccountInfo<'info>, 
    #[account(mut)]
    pub user_token_coll: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [
            USER_TROVE_REWARD_A_TAG, 
            user_trove.key().as_ref(), 
        ],
        bump = user_trove.user_trove_reward_token_a_nonce,
    )]
    pub user_trove_reward_token_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [
            USER_TROVE_REWARD_B_TAG, 
            user_trove.key().as_ref(), 
        ],
        bump = user_trove.user_trove_reward_token_b_nonce,
    )]
    pub user_trove_reward_token_b: Account<'info, TokenAccount>,

    pub raydium_program_id: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_pool_id: AccountInfo<'info>,
    pub raydium_pool_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user_trove_associated_info_account: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_pool_lp_account: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_pool_reward_token_a_account: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_pool_reward_token_b_account: AccountInfo<'info>,
    #[account(mut)]
    pub user_reward_token_a_account: AccountInfo<'info>,
    #[account(mut)]
    pub user_reward_token_b_account: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub clock: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct WithdrawRaydiumV5Collateral<'info> {
    pub owner: Signer<'info>,
    #[account(mut,
        seeds = [USER_TROVE_TAG,token_vault.key().as_ref(), owner.key().as_ref()],
        bump = user_trove.user_trove_nonce,
    )]
    pub user_trove:Account<'info, UserTrove>,
    #[account(mut,
        seeds = [TOKEN_VAULT_TAG,token_vault.mint_coll.as_ref()],
        bump = token_vault.token_vault_nonce
    )]
    pub token_vault:Account<'info, TokenVault>,
    #[account(mut)]
    pub user_trove_token_coll: AccountInfo<'info>, 
    #[account(mut)]
    pub user_token_coll: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [
            USER_TROVE_REWARD_A_TAG, 
            user_trove.key().as_ref(), 
        ],
        bump = user_trove.user_trove_reward_token_a_nonce,
    )]
    pub user_trove_reward_token_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [
            USER_TROVE_REWARD_B_TAG, 
            user_trove.key().as_ref(), 
        ],
        bump = user_trove.user_trove_reward_token_b_nonce,
    )]
    pub user_trove_reward_token_b: Account<'info, TokenAccount>,

    pub raydium_program_id: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_pool_id: AccountInfo<'info>,
    pub raydium_pool_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user_trove_associated_info_account: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_pool_lp_account: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_pool_reward_token_a_account: AccountInfo<'info>,
    #[account(mut)]
    pub raydium_pool_reward_token_b_account: AccountInfo<'info>,
    #[account(mut)]
    pub user_reward_token_a_account: AccountInfo<'info>,
    #[account(mut)]
    pub user_reward_token_b_account: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub clock: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(ceiling:u64)]
pub struct SetGlobalDebtCeiling<'info>{
    #[account(mut)]
    pub payer:  Signer<'info>,

    #[account(mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce,
        constraint = payer.key() == global_state.super_owner)]
    pub global_state: Account<'info, GlobalState>,
}

#[derive(Accounts)]
#[instruction(ceiling:u64)]
pub struct SetVaultDebtCeiling<'info>{
    #[account(mut)]
    pub payer:  Signer<'info>,

    #[account(mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.global_state_nonce)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut,
        constraint = mint_coll.key() == token_vault.mint_coll)]
    pub mint_coll:Account<'info, Mint>,

    #[account(mut,
        seeds = [
            TOKEN_VAULT_TAG,
            mint_coll.key().as_ref()
        ],
        bump = token_vault.token_vault_nonce,
        constraint = payer.key() == global_state.super_owner)]
    pub token_vault:Account<'info, TokenVault>,
}

#[derive(Accounts)]
#[instruction(miner_bump:u8, miner_vault_bump: u8)]
pub struct CreateQuarryMiner<'info> {

    #[account(mut,
        seeds = [TOKEN_VAULT_TAG, token_mint.key().as_ref()],
        bump = token_vault.token_vault_nonce,
    )]
    pub token_vault:Account<'info, TokenVault>,

    #[account(mut,
        seeds = [
            USER_TROVE_TAG,
            token_vault.key().as_ref(), 
            payer.key().as_ref()
        ],
        bump = user_trove.user_trove_nonce)]
    pub user_trove:Account<'info, UserTrove>,

    #[account(mut)]
    pub payer:  Signer<'info>,

    #[account(mut)]
    pub miner:AccountInfo<'info>,

    #[account(mut)]
    pub quarry:AccountInfo<'info>,
    pub rewarder:AccountInfo<'info>,
    pub token_mint:AccountInfo<'info>,
    #[account(init,
        token::mint = token_mint,
        token::authority = miner,
        seeds = [
            b"Miner-Vault".as_ref(), 
            miner.key().as_ref(), 
            token_mint.key().key().as_ref()
        ],
        bump = miner_vault_bump,
        payer = payer)]
    pub miner_vault:Account<'info, TokenAccount>,

    pub quarry_program:AccountInfo<'info>,
    pub token_program:Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct SaberFarm<'info> {
 
    #[account(mut)]
    pub quarry: AccountInfo<'info>,
 
    #[account(mut)]
    pub miner: AccountInfo<'info>,
 
    #[account(mut)]
    pub miner_vault: Box<Account<'info, TokenAccount>>,
}

#[derive(Accounts)]
pub struct SaberStaker<'info> {

    pub ratio_staker: RatioStaker<'info>,
    pub saber_farm: SaberFarm<'info>,

    //saber farm common
    #[account(mut)]
    pub saber_farm_rewarder: AccountInfo<'info>,
    
    pub saber_farm_program:AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct HarvestFromSaber<'info> {

    pub ratio_harvester: HarvestReward<'info>,
    
    //saber farm to stake 
    pub saber_farm: SaberFarm<'info>,

    #[account(mut, constraint = user_token_coll.owner == ratio_harvester.user_trove.key())]
    pub user_token_coll: Box<Account<'info, TokenAccount>>,

    pub saber_farm_program: AccountInfo<'info>,
    
    //saber farm common
    pub saber_farm_rewarder: Box<Account<'info, Rewarder>>,

    // Harvest
    #[account(mut)]
    pub mint_wrapper: AccountInfo<'info>,

    pub mint_wrapper_program: AccountInfo<'info>,
    
    #[account(mut)]
    pub minter: AccountInfo<'info>,
    
    #[account(mut)]
    pub rewards_token_mint: Box<Account<'info, Mint>>,
    
    #[account(mut)]
    pub claim_fee_token_account: Box<Account<'info, TokenAccount>>,
}
