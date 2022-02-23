// libraries
use anchor_lang::prelude::*;
// local imports
pub mod constants;
pub mod enums;
pub mod errors;
pub mod instructions;
pub mod states;
use crate::instructions::*;

declare_id!("FvTjLbwbHY4v8Gfv18JKuPCJG2Hj87CG8kPNHqGeHAR4");

#[program]
pub mod stable_pool {
    use super::*;

    pub fn create_global_state(
        ctx: Context<CreateGlobalState>,
        global_state_bump: u8,
        mint_usdx_bump: u8,
        tvl_limit: u64,
        debt_ceiling: u64,
    ) -> Result<()> {
        create_global_state::handle(
            ctx,
            global_state_bump,
            mint_usdx_bump,
            tvl_limit,
            debt_ceiling,
        )
    }

    pub fn create_vault(
        ctx: Context<CreateVault>,
        vault_bump: u8,
        risk_level: u8,
        is_dual: u8,
        debt_ceiling: u64,
        platform_type: u8,
    ) -> Result<()> {
        create_vault::handle(
            ctx,
            vault_bump,
            risk_level,
            is_dual,
            debt_ceiling,
            platform_type,
        )
    }

    pub fn create_trove(
        ctx: Context<CreateTrove>,
        trove_nonce: u8,
        ata_trove_nonce: u8,
        ceiling: u64,
    ) -> Result<()> {
        create_trove::handle(ctx, trove_nonce, ata_trove_nonce, ceiling)
    }
}
