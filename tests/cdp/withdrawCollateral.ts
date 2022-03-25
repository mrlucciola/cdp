import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { assert, expect } from "chai";
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import { USDCUSDT_DECIMALS } from "../utils/constants";
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

export const withdrawCollateralFAIL_NotEnoughTokensInTrove = async (
  user: User,
  accounts: Accounts
) => {
  const withdrawAmount = 1;
  const userlpSaber = user.tokens.lpSaber;
  // check balances before
  const troveBalPre = (await userlpSaber.trove.ata.getBalance()).value.uiAmount;
  const userBalPre = (await userlpSaber.ata.getBalance()).value.uiAmount;

  assert(withdrawAmount > troveBalPre, 
    "Test requires attempting to withdraw more tokens than in the trove. Please increase deposit amount\n" +
    "Withdraw Amount: " + withdrawAmount + " Trove Balance: " + troveBalPre);

  await expect(
    withdrawCollateralCall(
    // withdraw amount
    withdrawAmount * USDCUSDT_DECIMALS,
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
    )
  ).is.rejected;

  const troveBalPost = (await userlpSaber.trove.ata.getBalance()).value.uiAmount;
  const diff = troveBalPre - troveBalPre;

  assert(diff == 0, "Withdraw did not fail when attempting to withdraw more tokens than are in the trove");
};

export const withdrawCollateralFAIL_AttemptWithdrawFromOtherUser = async (
  user: User,
  otherUser: User,
  accounts: Accounts
) => {
  const withdrawAmount = 0.1;
  const userlpSaber = user.tokens.lpSaber;
  const otherUserlpSaber = otherUser.tokens.lpSaber;
  // check balances before
  const userTroveBalPre = (await userlpSaber.trove.ata.getBalance()).value.uiAmount;
  const userBalPre = (await userlpSaber.ata.getBalance()).value.uiAmount;
  const otherUserTroveBalPre = (await otherUserlpSaber.trove.ata.getBalance()).value.uiAmount;
  const otherUserBalPre = (await otherUserlpSaber.ata.getBalance()).value.uiAmount;

  assert(withdrawAmount <= userTroveBalPre,
    "Test requires attempting to withdraw tokens <= that in the trove. Please decrease withdraw amount\n" +
    "Withdraw Amount: " + withdrawAmount + " User Trove Balance: " + userTroveBalPre);
  
  await expect(
    withdrawCollateralCall(
    // withdraw amount
    withdrawAmount * LAMPORTS_PER_SOL,
    // other user connection
    otherUser.provider.connection,
    // other user wallet
    otherUser.wallet,
    // other user token
    otherUserlpSaber,
    // user trove
    // note: not other user trove since other user is trying to withdraw from user's trove
    userlpSaber.trove,
    // mint pubKey
    accounts.lpSaberUsdcUsdt.mint,
    // vault
    accounts.lpSaberUsdcUsdt.vault,
    // globalState
    accounts.global        
    )
  ).to.be.rejectedWith(
    "2006", // ConstraintSeeds: a seeds constraint was violated
    "No error thrown when trying to withdraw from another user's trove"
  );

  const userTroveBalPost = (await userlpSaber.trove.ata.getBalance()).value.uiAmount;
  const userBalPost = (await userlpSaber.ata.getBalance()).value.uiAmount;
  const otherUserTroveBalPost = (await otherUserlpSaber.trove.ata.getBalance()).value.uiAmount;
  const otherUserBalPost = (await otherUserlpSaber.ata.getBalance()).value.uiAmount;

  const userTroveDiff = userTroveBalPre - userTroveBalPost;
  const userBalDiff = userBalPost - userBalPre;
  const otherUserTroveDiff = otherUserTroveBalPre - otherUserTroveBalPost;
  const otherUserBalDiff = otherUserBalPost - otherUserBalPre;

  assert(userTroveDiff == 0, "Tokens were withdrawn from user's trove by other user. Major security bug.");
  assert(userBalDiff == 0, "User ATA balance has changed after an attempted withdrawal from another user");
  assert(otherUserTroveDiff == 0, "Other user trove balance changed when attempting to withdraw from user's trove");
  assert(otherUserBalDiff == 0, "Other user was successful in withdrawing from user's trove. Major security bug.")
};

export const withdrawCollateralPASS = async (
  user: User,
  accounts: Accounts
) => {
  const withdrawAmount = 0.1;
  const userlpSaber = user.tokens.lpSaber;
  // check balances before
  const troveBalPre = (await userlpSaber.trove.ata.getBalance()).value.uiAmount;
  const userBalPre = (await userlpSaber.ata.getBalance()).value.uiAmount;

  // let globalStateAcct: IdlAccounts<StablePool>["globalState"] = await accounts.global.getAccount();
  // const tvlPre = globalStateAcct.tvlUsd.toNumber();

  assert(withdrawAmount <= troveBalPre,
    "Test requires withdrawing an amount less than the trove balance so it will succeed.\n" +
    "Withdraw Amount: " + withdrawAmount + " Trove Balance: " + troveBalPre);
  
  await withdrawCollateralCall(
    // withdraw amount
    withdrawAmount * USDCUSDT_DECIMALS,
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

  const differenceThreshold = 0.0001; // set arbitrarily
  assert(Math.abs(userDiff - withdrawAmount) < differenceThreshold, 
    "Expected User ATA Diff: " + withdrawAmount + "Actual User ATA Diff: " + userDiff);
  assert(Math.abs(troveDiff + withdrawAmount) < differenceThreshold,
    "Expected User Trove Diff: " + (-withdrawAmount) + " Actual User Trove Diff: " + troveDiff);

  // globalStateAcct = await accounts.global.getAccount();
  // const tvlPost = globalStateAcct.tvlUsd.toNumber();
  // // may need to change from == to <= some small delta value to account for price flucuations
  // assert(tvlPre - tvlPost == withdrawAmount * LAMPORTS_PER_SOL* priceUsd,
  //   "TVL did not update correctly.\n" + 
  //   "Expected TVL Difference: " + withdrawAmount * LAMPORTS_PER_SOL* priceUsd + 
  //   " Actual TVL Difference: " + (tvlPre - tvlPost));
};
