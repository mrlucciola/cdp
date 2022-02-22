// libraries
use anchor_lang::prelude::*;
// local imports
pub mod constants;
pub mod instructions;
pub mod states;
pub mod errors;
use crate::{
    // utils::*, states::*,
    instructions::*,
};

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
}
