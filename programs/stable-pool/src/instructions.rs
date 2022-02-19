use anchor_lang::prelude::*;
use quarry_mine::Rewarder;
// local
use anchor_spl::{token::{self, Token, TokenAccount, Mint}};

use crate::{
    states::*,
    constant::*,
    site_fee_owner
};

#[derive(Accounts)]
#[instruction(global_state_nonce:u8, mint_usd_nonce:u8, tvl_limit:u64, debt_ceiling:u64)]
pub struct CreateGlobalState<'info>{
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state_nonce,
        payer = authority,
        )]
    pub global_state: Account<'info, GlobalState>,

    #[account(init,
        mint::decimals = USD_DECIMALS,
        mint::authority = global_state,
        seeds = [MINT_USD_SEED],
        bump = mint_usd_nonce,
        payer = authority)]
    pub mint_usd: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct SetHarvestFee<'info>{
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,
}

#[derive(Accounts)]
pub struct ToggleEmerState<'info>{
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,
}

#[derive(Accounts)]
pub struct SetCollateralRatio<'info>{
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,
}

// no tests yet
#[derive(Accounts)]
pub struct ChangeAuthority<'info>{
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,
    pub new_owner: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(vault_bump :u8, risk_level: u8, is_dual: u8, debt_ceiling: u64, platform_type: u8)]
pub struct CreateVault<'info> {
    #[account(mut)]
    pub authority:  Signer<'info>,

    #[account(
        init,
        seeds = [VAULT_SEED, mint_coll.key().as_ref()],
        bump = vault_bump,
        payer = authority,)]
    pub vault: Box<Account<'info, Vault>>,

    #[account(mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce,
        has_one = authority)]
    pub global_state: Box<Account<'info, GlobalState>>,

    pub mint_coll: Box<Account<'info, Mint>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(trove_nonce: u8, ata_trove_nonce: u8)]
pub struct CreateTrove<'info> {

    #[account(
        mut,
        seeds = [VAULT_SEED, vault.mint_coll.as_ref()],
        bump = vault.vault_bump,
    )]
    pub vault: Box<Account<'info, Vault>>, // prev: TokenVault

    #[account(
        init,
        seeds = [TROVE_SEED, vault.key().as_ref(), authority.key().as_ref()],
        bump = trove_nonce,
        payer = authority,
    )]
    pub trove: Box<Account<'info, Trove>>,

    pub authority: Signer<'info>,
    // ata migh not be the correct term
    #[account(
        init,
        token::mint = mint_coll,
        token::authority = trove,
        seeds = [
            TROVE_POOL_SEED,
            trove.key().as_ref(),
            mint_coll.key().as_ref(),
        ],
        bump = ata_trove_nonce,
        payer = authority,
    )]
    pub ata_trove: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint = mint_coll.key() == vault.mint_coll)]
    pub mint_coll: Box<Account<'info, Mint>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(reward_vault_bump: u8)]
pub struct CreateUserRewardVault<'info> {

    #[account(
        mut,
        seeds = [VAULT_SEED, vault.mint_coll.as_ref()],
        bump = vault.vault_bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        seeds = [TROVE_SEED, vault.key().as_ref(), authority.key().as_ref()],
        bump = trove.trove_nonce,
    )]
    pub trove: Box<Account<'info, Trove>>,

    pub authority: Signer<'info>,

    // this may be incorrect - either the seeds or the var name. TROVE_POOL_SEED is used for ata owned by trove
    #[account(
        init,
        token::mint = reward_mint,
        token::authority = trove,
        seeds = [
            TROVE_POOL_SEED, 
            trove.key().as_ref(), 
            reward_mint.key().key().as_ref(),
        ],
        bump = reward_vault_bump,
        payer = authority,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,
    
    pub reward_mint: Box<Account<'info, Mint>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct RatioStaker<'info> {
    pub authority: Signer<'info>,
    #[account(mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce)]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(mut,
        seeds = [VAULT_SEED,mint_coll.key().as_ref()],
        bump = vault.vault_bump,
    )]
    pub vault: Box<Account<'info, Vault>>,
    // holds the state for a user w.r.t a given token
    #[account(mut,
        seeds = [
            TROVE_SEED,
            vault.key().as_ref(), 
            authority.key().as_ref()
        ],
        bump = trove.trove_nonce)]
    pub trove: Box<Account<'info, Trove>>,
    
    // token account for pool's/vault's collateral token
    #[account(mut,
        seeds = [
            TROVE_POOL_SEED, 
            trove.key().as_ref(), 
            vault.mint_coll.as_ref()
        ],
        bump = trove.ata_trove_nonce,
    )]
    pub ata_trove: Box<Account<'info, TokenAccount>>,
    // token account for user's collateral token
    #[account(mut,
        constraint = ata_user_coll.owner == authority.key(),
        constraint = ata_user_coll.mint == vault.mint_coll)]
    pub ata_user_coll: Box<Account<'info, TokenAccount>>,

    #[account(mut, constraint = mint_coll.key() == vault.mint_coll)]
    pub mint_coll: Box<Account<'info, Mint>>,

    pub token_program:Program<'info, Token>,
}

#[derive(Accounts)]
pub struct HarvestReward<'info> {

    #[account(mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce)]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(mut,
        seeds = [VAULT_SEED, mint_coll.key().as_ref()],
        bump = vault.vault_bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(mut,
        seeds = [TROVE_SEED,vault.key().as_ref(), authority.key().as_ref()],
        bump = trove.trove_nonce)]
    pub trove: Box<Account<'info, Trove>>,

    pub authority: Signer<'info>,

    #[account(mut, constraint = trove_reward.owner == trove.key())]
    pub trove_reward:Box<Account<'info, TokenAccount>>,

    #[account(mut,
        constraint = user_reward_token.owner == authority.key(),
        constraint = user_reward_token.mint == vault.reward_mint_a)]
    pub user_reward_token: Box<Account<'info, TokenAccount>>,

    #[account(mut, 
        constraint = reward_fee_token.owner == site_fee_owner::ID,
        constraint = reward_fee_token.mint == vault.reward_mint_a,
    )]
    pub reward_fee_token:Box<Account<'info, TokenAccount>>,

    #[account(constraint = mint_coll.key() == vault.mint_coll)]
    pub mint_coll: Box<Account<'info, Mint>>,

    pub system_program: Program<'info, System>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,

    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(amount: u64, user_usd_token_nonce: u8)]
pub struct BorrowUsd<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut,
        seeds = [VAULT_SEED,mint_coll.key().as_ref()],
        bump = vault.vault_bump,
    )]
    pub vault: Box<Account<'info, Vault>>,
    #[account(mut,
        seeds = [TROVE_SEED,vault.key().as_ref(), authority.key().as_ref()],
        bump = trove.trove_nonce)]
    pub trove: Box<Account<'info, Trove>>,

    #[account(mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce)]
    pub global_state: Account<'info, GlobalState>,

    #[account(
        seeds = [PRICE_FEED_TAG,vault.mint_coll.as_ref()],
        bump,
    )]
    pub price_feed: Box<Account<'info, PriceFeed>>,
    
    

    #[account(mut,
        seeds = [MINT_USD_SEED],
        bump = global_state.mint_usd_nonce,
        constraint = mint_usd.key() == global_state.mint_usd
    )]
    pub mint_usd: Box<Account<'info, Mint>>,
    #[account(init_if_needed,
        token::mint = mint_usd,
        token::authority = authority,
        seeds = [
            USD_TOKEN_SEED, 
            authority.key().as_ref(), 
            mint_usd.key().as_ref()
        ],
        bump = user_usd_token_nonce,
        payer = authority)]
    pub ata_user_usd: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        constraint = mint_coll.key() == vault.mint_coll)]
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
        seeds = [VAULT_SEED,mint_coll.key().as_ref()],
        bump = vault.vault_bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(mut,
        seeds = [TROVE_SEED,vault.key().as_ref(), owner.key().as_ref()],
        bump = trove.trove_nonce)]
    pub trove: Box<Account<'info, Trove>>,

    #[account(mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce)]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(mut,
        seeds = [MINT_USD_SEED],
        bump = global_state.mint_usd_nonce,
        constraint = mint_usd.key() == global_state.mint_usd
    )]
    pub mint_usd: Box<Account<'info, Mint>>,
    
    #[account(mut)]
    pub ata_user_usd: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        constraint = mint_coll.key() == vault.mint_coll)]
    pub mint_coll: Box<Account<'info, Mint>>,
    
    pub token_program:Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetGlobalTvlLimit<'info>{
    #[account(mut)]
    pub authority:  Signer<'info>,

    #[account(mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,
}

#[derive(Accounts)]
pub struct SetGlobalDebtCeiling<'info>{
    #[account(mut)]
    pub authority:  Signer<'info>,

    #[account(mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,
}

#[derive(Accounts)]
pub struct SetVaultDebtCeiling<'info>{
    #[account(mut)]
    pub authority:  Signer<'info>,

    #[account(mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut,
        constraint = mint_coll.key() == vault.mint_coll)]
    pub mint_coll:Account<'info, Mint>,

    #[account(mut,
        seeds = [
            VAULT_SEED,
            mint_coll.key().as_ref(),
        ],
        bump = vault.vault_bump,
    )]
    pub vault:Account<'info, Vault>,
}

// who is setting the debt ceiling, and for which user(s)?
#[derive(Accounts)]
pub struct SetUserDebtCeiling<'info>{
    #[account(mut)]
    pub authority: Signer<'info>,
    pub user: AccountInfo<'info>,

    #[account(mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.global_state_nonce,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut,
        constraint = mint_coll.key() == vault.mint_coll)]
    pub mint_coll: Account<'info, Mint>,

    #[account(mut,
        seeds = [
            VAULT_SEED,
            mint_coll.key().as_ref()
        ],
        bump = vault.vault_bump)]
    pub vault: Account<'info, Vault>,

    #[account(mut,
        seeds = [TROVE_SEED,vault.key().as_ref(), user.key().as_ref()],
        bump = trove.trove_nonce,
    )]
    pub trove:Account<'info, Trove>,
}

#[derive(Accounts)]
#[instruction(miner_bump:u8, miner_vault_bump: u8)]
pub struct CreateQuarryMiner<'info> {

    #[account(mut,
        seeds = [VAULT_SEED, token_mint.key().as_ref()],
        bump = vault.vault_bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(mut,
        seeds = [
            TROVE_SEED,
            vault.key().as_ref(), 
            payer.key().as_ref(),
        ],
        bump = trove.trove_nonce,
    )]
    pub trove: Box<Account<'info, Trove>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub miner: AccountInfo<'info>,

    #[account(mut)]
    pub quarry: AccountInfo<'info>,
    pub rewarder: AccountInfo<'info>,
    pub token_mint: AccountInfo<'info>,

    #[account(init,
        token::mint = token_mint,
        token::authority = miner,
        seeds = [
            b"Miner-Vault".as_ref(), 
            miner.key().as_ref(), 
            token_mint.key().key().as_ref(),
        ],
        bump = miner_vault_bump,
        payer = payer,
    )]
    pub miner_vault: Box<Account<'info, TokenAccount>>,

    pub quarry_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
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
    // token account for user's collateral token
    #[account(mut, constraint = ata_user_coll.owner == ratio_harvester.trove.key())]
    pub ata_user_coll: Box<Account<'info, TokenAccount>>,

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


#[derive(Accounts)]
#[instruction(pair_count: u8)]
pub struct CreatePriceFeed<'info> {
    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump,
        has_one = authority)]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        seeds = [VAULT_SEED,mint_coll.key().as_ref()],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        init,
        seeds = [PRICE_FEED_TAG, vault.mint_coll.as_ref()],
        bump,
        payer = authority
    )]
    pub price_feed: Box<Account<'info, PriceFeed>>,

    pub mint_coll: Box<Account<'info, Mint>>,
    pub mint_a: Box<Account<'info, Mint>>,
    pub mint_b: Box<Account<'info, Mint>>,
    pub mint_c: Box<Account<'info, Mint>>,

    #[account(mut,
        constraint = vault_a.mint == mint_a.key()
    )]
    pub vault_a: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = vault_b.mint == mint_b.key()
    )]
    pub vault_b: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = vault_c.mint == mint_c.key()
    )]
    pub vault_c: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub authority:  Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction()]
pub struct UpdatePriceFeed<'info> {
    #[account(
        mut,
        seeds = [PRICE_FEED_TAG,mint_coll.key().as_ref()],
        bump,
    )]
    pub price_feed: Box<Account<'info, PriceFeed>>,

    pub mint_coll: Box<Account<'info, Mint>>,

    #[account(mut,
        constraint = vault_a.mint == price_feed.mint_a
    )]
    pub vault_a: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = vault_b.mint == price_feed.mint_b
    )]
    pub vault_b: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = vault_c.mint == price_feed.mint_c
    )]
    pub vault_c: Box<Account<'info, TokenAccount>>,

    pub clock: Sysvar<'info, Clock>,
}
