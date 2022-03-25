import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Transaction } from "@solana/web3.js";
import { assert, expect } from "chai";
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import { DECIMALS_USDCUSDT } from "../utils/constants";
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
  const withdrawAmountUi = 1;
  const withdrawAmountPrecise = withdrawAmountUi * 10 ** DECIMALS_USDCUSDT;
  const userlpSaber = user.tokens.lpSaber;
  // check balances before
  const troveBalPre = Number(
    (await userlpSaber.trove.ata.getBalance()).value.amount
  );
  // const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);

  assert(
    withdrawAmountPrecise > troveBalPre,
    "Test requires attempting to withdraw more tokens than in the trove. Please increase deposit amount\n" +
      `Withdraw Amount: ${withdrawAmountPrecise}   Trove Balance: ${troveBalPre}`
  );

  await expect(
    withdrawCollateralCall(
      // withdraw amount
      withdrawAmountPrecise,
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

  const troveBalPost = Number(
    (await userlpSaber.trove.ata.getBalance()).value.amount
  );
  const diff = troveBalPost - troveBalPre;

  assert(
    diff == 0,
    "Withdraw did not fail when attempting to withdraw more tokens than are in the trove"
  );
};

export const withdrawCollateralFAIL_AttemptWithdrawFromOtherUser = async (
  user: User,
  otherUser: User,
  accounts: Accounts
) => {
  const withdrawAmountUi = 0.1;
  const withdrawAmountPrecise = withdrawAmountUi * 10 ** DECIMALS_USDCUSDT;
  const userlpSaber = user.tokens.lpSaber;
  const otherUserlpSaber = otherUser.tokens.lpSaber;
  // check balances before
  const userTroveBalPre = Number(
    (await userlpSaber.trove.ata.getBalance()).value.amount
  );
  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);
  const otherUserTroveBalPre = Number(
    (await otherUserlpSaber.trove.ata.getBalance()).value.amount
  );
  const otherUserBalPre = Number(
    (await otherUserlpSaber.ata.getBalance()).value.amount
  );

  assert(
    withdrawAmountPrecise <= userTroveBalPre,
    "Test requires attempting to withdraw tokens <= that in the trove. Please decrease withdraw amount\n" +
      `\nWithdraw Amount:: ${withdrawAmountPrecise}  Trove Balance: ${userTroveBalPre}`
  );

  await expect(
    withdrawCollateralCall(
      // withdraw amount
      withdrawAmountPrecise,
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

  const userTroveBalPost = Number(
    (await userlpSaber.trove.ata.getBalance()).value.amount
  );
  const userBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  const otherUserTroveBalPost = Number(
    (await otherUserlpSaber.trove.ata.getBalance()).value.amount
  );
  const otherUserBalPost = Number(
    (await otherUserlpSaber.ata.getBalance()).value.amount
  );

  console.log("heliere\n\n\n\n", userTroveBalPre - userTroveBalPost);
  const userTroveDiff = userTroveBalPre - userTroveBalPost;
  const userBalDiff = userBalPost - userBalPre;
  const otherUserTroveDiff = otherUserTroveBalPre - otherUserTroveBalPost;
  const otherUserBalDiff = otherUserBalPost - otherUserBalPre;

  assert(
    userTroveDiff === 0,
    "Tokens were withdrawn from base-user's trove by test-user. Major security bug."
  );
  assert(
    userBalDiff === 0,
    "User ATA balance has changed after an attempted withdrawal from another user"
  );
  assert(
    otherUserTroveDiff === 0,
    "Other user trove balance changed when attempting to withdraw from user's trove"
  );
  assert(
    otherUserBalDiff === 0,
    "Other user was successful in withdrawing from user's trove. Major security bug."
  );
};

export const withdrawCollateralPASS = async (
  user: User,
  accounts: Accounts
) => {
  const withdrawAmountUi = 0.1;
  const withdrawAmountPrecise = withdrawAmountUi * 10 ** DECIMALS_USDCUSDT;
  const userlpSaber = user.tokens.lpSaber;
  // check balances before
  const troveBalPre = Number(
    (await userlpSaber.trove.ata.getBalance()).value.amount
  );
  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);

  // let globalStateAcct: IdlAccounts<StablePool>["globalState"] = await accounts.global.getAccount();
  // const tvlPre = globalStateAcct.tvlUsd.toNumber();

  assert(
    withdrawAmountPrecise <= troveBalPre,
    "Test requires withdrawing an amount less than the trove balance so it will succeed.\n" +
      `Withdraw Amount: ${withdrawAmountPrecise}   Trove Balance: ${troveBalPre}`
  );

  await withdrawCollateralCall(
    // withdraw amount
    withdrawAmountPrecise,
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
  const troveBalPost = Number(
    (await userlpSaber.trove.ata.getBalance()).value.amount
  );
  const userBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  const userDiff = userBalPost - userBalPre;
  const troveDiff = troveBalPost - troveBalPre;
  console.log(`user balance: ${userBalPre} -> ${userBalPost} ∆=${userDiff}`);
  console.log(
    `trove balance: ${troveBalPre} -> ${troveBalPost} ∆=${troveDiff}`
  );

  const differenceThreshold = 0.0001; // set arbitrarily
  assert(
    Math.abs(userDiff - withdrawAmountPrecise) < differenceThreshold,
    `Expected User ATA Diff: ${withdrawAmountPrecise}` +
      `Actual User ATA Diff: ${userDiff}`
  );
  assert(
    Math.abs(troveDiff + withdrawAmountPrecise) < differenceThreshold,
    `Expected User Trove Diff: ${userDiff}` +
      `Actual User Trove Diff: ${troveDiff}`
  );

  // globalStateAcct = await accounts.global.getAccount();
  // const tvlPost = globalStateAcct.tvlUsd.toNumber();
  // // may need to change from == to <= some small delta value to account for price flucuations
  // assert(tvlPre - tvlPost == withdrawAmount * LAMPORTS_PER_SOL* priceUsd,
  //   "TVL did not update correctly.\n" +
  //   "Expected TVL Difference: " + withdrawAmount * LAMPORTS_PER_SOL* priceUsd +
  //   " Actual TVL Difference: " + (tvlPre - tvlPost));
};
