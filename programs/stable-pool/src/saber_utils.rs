use anchor_lang::prelude::*;
use quarry_mine::cpi::{
    create_miner, 
    accounts::{
        CreateMiner
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
            quarry_program.to_account_info(),
            CreateMiner{
                authority: authority.to_account_info(),
                miner: miner.to_account_info(),
                quarry: quarry.to_account_info(),
                miner_vault: miner_vault.to_account_info(),
                token_mint: token_mint.to_account_info(),
                rewarder: rewarder.to_account_info(),
                payer: payer.to_account_info(),
                token_program: token_program.to_account_info(),
                system_program: system_program.to_account_info(),
            }
        ).with_signer(&[&authority_seeds[..]]),
        miner_bump
    )
}