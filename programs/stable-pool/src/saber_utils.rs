use anchor_lang::prelude::*;
use quarry_mine::cpi::{
    create_miner, 
    accounts::{
        CreateMiner,
    }
};

pub fn create_miner_pda<'info>(
    quarry_program: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    miner: AccountInfo<'info>, 
    quarry: AccountInfo<'info>,
    miner_vault: AccountInfo<'info>,
    token_mint: AccountInfo<'info>,
    rewarder: AccountInfo<'info>,
    payer: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
    authority_seeds: &[&[u8]],
    miner_bump: u8,
) -> Result<()>{
    create_miner(
        CpiContext::new(
            quarry_program,
            CreateMiner{
                authority,
                miner,
                quarry,
                miner_vault,
                token_mint,
                rewarder,
                payer,
                token_program,
                system_program,
            }
        ).with_signer(&[&authority_seeds[..]]),
        miner_bump
    )
}
