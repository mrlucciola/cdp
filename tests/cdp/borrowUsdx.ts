// anchor/solana
import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
// local
import { StablePool } from "../../target/types/stable_pool";
import { DECIMALS_USDX } from "../utils/constants";
import { createAtaOnChain, handleTxn } from "../utils/fxns";
// interfaces
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";
import {
  GlobalStateAcct,
  MintAcct,
  MintPubKey,
  UserToken,
  Pool,
  GeneralToken,
} from "../utils/interfaces";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
export const borrowUsdxCall = async (
  borrowAmount: number,
  userConnection: Connection,
  userWallet: Wallet,
  userToken: UserToken,
  userUSDx: GeneralToken,
  mintUsdx: MintAcct,
  pool: Pool,
  globalState: GlobalStateAcct,
  mintColl: MintPubKey
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.borrowUsdx(new BN(borrowAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,

        oracleA: pool.oracles.usdc.pubKey,
        oracleB: pool.oracles.usdt.pubKey,
        ataMarketA: pool.ataMarketTokens.usdc.pubKey,
        ataMarketB: pool.ataMarketTokens.usdt.pubKey,

        mintColl, // the collat token mint that the pool represents
        pool: pool.pubKey,
        vault: userToken.vault.pubKey,

        mintUsdx: mintUsdx.pubKey,
        ataUsdx: userUSDx.ata.pubKey,

        // system accts
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
  console.log(await userToken.ata.getBalance());
};
// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
export const borrowUsdxPASS = async (user: User, accounts: Accounts) => {
  const usdxUser = user.tokens.usdx;
  const borrowAmtUi = 900;
  const borrowAmtPrecise = borrowAmtUi * 10 ** DECIMALS_USDX;

  // create the ata
  await createAtaOnChain(
    user.wallet,
    user.tokens.usdx.ata,
    accounts.usdx.pubKey,
    null,
    user.provider.connection
  );

  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
  await borrowUsdxCall(
    // borrow/mint amount
    borrowAmtPrecise,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // userToken
    user.tokens.lpSaber,
    // userUSDx
    user.tokens.usdx,
    // mintUsdx
    accounts.usdx,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // globalState
    accounts.global,
    // mintColl
    accounts.lpSaberUsdcUsdt.mint
  );

  const userBalPost = Number((await usdxUser.ata.getBalance()).value.amount);
  console.log(`user USDX balance: ${0} -> ${userBalPost} ∆=${userBalPost}`);
};
