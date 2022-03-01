import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  LAMPORTS_PER_SOL,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import { handleTxn } from "../utils/fxns";
import {
  GlobalStateAcct,
  MintAcct,
  MintPubKey,
  Trove,
  User,
  UserToken,
  Vault,
} from "../utils/interfaces";

const programStablePool = workspace.StablePool as Program<StablePool>;
// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
const borrowUsdxCall = async (
  borrowAmount: number,
  userConnection: Connection,
  userWallet: Wallet,
  userToken: UserToken,
  mintUsdx: MintAcct,
  vault: Vault,
  globalState: GlobalStateAcct
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.borrowUsdx(new BN(borrowAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        vault: vault.pubKey,
        // trove: trove.pubKey,
        // mintUsdx: trove.ata.pubKey,
        ataUsdx: userToken.ata.pubKey,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
};
// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
export const borrowUsdxPASS = async (user: User, accounts: Accounts) => {
  const userUsdx = user.tokens.usdx;

  const userBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
  await borrowUsdxCall(
    // borrow/mint amount
    900 * LAMPORTS_PER_SOL,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // user token
    // user.tokens.lpSaber,
    // trove
    user.tokens.lpSaber,
    // mintUsdx MintAcct
    accounts.usdx,
    // vault
    accounts.lpSaberUsdcUsdt.vault,
    // globalState
    accounts.global
  );

  const userBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const userDiff = userBalPost - userBalPre;
  console.log(
    `user USDX balance: ${userBalPre} -> ${userBalPost} ∆=${userDiff}`
  );
};
