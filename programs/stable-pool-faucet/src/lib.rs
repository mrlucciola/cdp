use anchor_lang::prelude::*;

// declare
declare_id!("AGVmoEHbb6Uob1jgHWhpQs7pDgMCMkbKbYuTum71zrsx");

#[program]
pub mod stable_pool_faucet {
    use super::*;

    pub fn init(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}


#[derive(Accounts)]
pub struct Initialize {}
