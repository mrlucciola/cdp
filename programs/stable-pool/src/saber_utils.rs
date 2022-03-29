use anchor_lang::prelude::*;
// use quarry_mine::cpi::{accounts::CreateMiner, create_miner};

pub fn create_miner_pda<'info>(// quarry_program: AccountInfo<'info>,
    // authority: AccountInfo<'info>,
    // miner: AccountInfo<'info>,
    // quarry: AccountInfo<'info>,
    // miner_vault: AccountInfo<'info>,
    // token_mint: AccountInfo<'info>,
    // rewarder: AccountInfo<'info>,
    // payer: AccountInfo<'info>,
    // token_program: AccountInfo<'info>,
    // system_program: AccountInfo<'info>,
    // authority_seeds: &[&[u8]],
    // miner_bump: u8,
) -> Result<()> {
    // let quarry = &mut ctx.accounts.quarry;
    // let index = quarry.num_miners;
    // quarry.num_miners = unwrap_int!(quarry.num_miners.checked_add(1));

    // let miner = &mut ctx.accounts.miner;
    // miner.authority = ctx.accounts.authority.key();
    // miner.bump = *unwrap_int!(ctx.bumps.get("miner"));
    // miner.quarry_key = ctx.accounts.quarry.key();
    // miner.token_vault_key = ctx.accounts.miner_vault.key();
    // miner.rewards_earned = 0;
    // miner.rewards_per_token_paid = 0;
    // miner.balance = 0;
    // miner.index = index;

    // emit!(MinerCreateEvent {
    //     authority: miner.authority,
    //     quarry: miner.quarry_key,
    //     miner: miner.key(),
    // });

    Ok(())

    // create_miner(
    //     CpiContext::new(
    //         quarry_program,
    //         CreateMiner {
    //             authority,
    //             miner,
    //             quarry,
    //             miner_vault,
    //             token_mint,
    //             rewarder,
    //             payer,
    //             token_program,
    //             system_program,
    //         },
    //     )
    //     .with_signer(&[&authority_seeds[..]]),
    //     miner_bump,
    // )
}
