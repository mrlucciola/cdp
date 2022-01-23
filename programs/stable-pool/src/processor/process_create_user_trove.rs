use anchor_lang::prelude::*;

use crate::{
    instructions::*
};

pub fn process_create_user_trove(ctx: Context<CreateUserTrove>, user_trove_nonce:u8, token_coll_nonce:u8) -> ProgramResult {
    ctx.accounts.user_trove.locked_coll_balance = 0;
    ctx.accounts.user_trove.debt = 0;
    ctx.accounts.user_trove.user_trove_nonce = user_trove_nonce;
    ctx.accounts.user_trove.token_coll_nonce = token_coll_nonce;
    Ok(())
}
