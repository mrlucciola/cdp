import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import { handleTxn } from "../utils/fxns";
import {
  GlobalStateAcct,
  MintPubKey,
  Trove,
  User,
  UserToken,
  Vault,
} from "../utils/interfaces";

const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * * we have params and their classes like this so we can guarantee-
 *     we are passing in the right values
 * @param withdrawAmount
 * @param userWallet
 * @param userToken
 * @param mintPubKey
 * @param trove
 * @param vault
 * @param globalState
 */
const withdrawCollateralCall = async (
  withdrawAmount: number,
  userConnection: Connection,
  userWallet: Wallet,
  userToken: UserToken,
  trove: Trove,
  mintPubKey: MintPubKey,
  vault: Vault,
  globalState: GlobalStateAcct
) => {
  console.log("ata balance: ", await userToken.ata.getBalance());
  const txn = new Transaction().add(
    programStablePool.instruction.withdrawCollateral(new BN(withdrawAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        vault: vault.pubKey,
        trove: trove.pubKey,
        ataTrove: trove.ata.pubKey,
        ataUser: userToken.ata.pubKey,
        mint: mintPubKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
};

export const withdrawCollateralPASS = async (
  user: User,
  accounts: Accounts
) => {
  const userlpSaber = user.tokens.lpSaber;
  // check balances before
  const troveBalPre = (await userlpSaber.trove.ata.getBalance()).value.uiAmount;
  const userBalPre = (await userlpSaber.ata.getBalance()).value.uiAmount;
  
  await withdrawCollateralCall(
    // withdraw amount
    0.1 * LAMPORTS_PER_SOL,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // user token
    userlpSaber,
    // trove
    userlpSaber.trove,
    // mint pubKey
    accounts.lpSaberUsdcUsdt.mint,
    // vault
    accounts.lpSaberUsdcUsdt.vault,
    // globalState
    accounts.global
  );

  // check balances after
  const troveBalPost = (await userlpSaber.trove.ata.getBalance()).value
    .uiAmount;
  const userBalPost = (await userlpSaber.ata.getBalance()).value.uiAmount;
  const userDiff = userBalPost - userBalPre;
  const troveDiff = troveBalPost - troveBalPre;
  console.log(`user balance: ${userBalPre} -> ${userBalPost} ∆=${userDiff}`);
  console.log(
    `trove balance: ${troveBalPre} -> ${troveBalPost} ∆=${troveDiff}`
  );
};
