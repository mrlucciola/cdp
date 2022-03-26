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
  Vault,
  User,
  UserToken,
  Pool,
} from "../utils/interfaces";

const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * * we have params and their classes like this so we can guarantee-
 *     we are passing in the right values
 */
const withdrawCollateralCall = async (
  withdrawAmount: number,
  userConnection: Connection,
  userWallet: Wallet,
  userToken: UserToken,
  vault: Vault,
  mintPubKey: MintPubKey,
  pool: Pool,
  globalState: GlobalStateAcct
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.withdrawCollateral(new BN(withdrawAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        ataVault: vault.ata.pubKey,
        ataUser: userToken.ata.pubKey,
        mint: mintPubKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
};

export const withdrawCollateralFAIL_NotEnoughTokensInVault = async (
  user: User,
  accounts: Accounts
) => {
  const withdrawAmountUi = 1;
  const withdrawAmountPrecise = withdrawAmountUi * 10 ** DECIMALS_USDCUSDT;
  const userlpSaber = user.tokens.lpSaber;
  // check balances before
  const vaultBalPre = Number(
    (await userlpSaber.vault.ata.getBalance()).value.amount
  );
  // const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);

  assert(
    withdrawAmountPrecise > vaultBalPre,
    "Test requires attempting to withdraw more tokens than in the vault. Please increase deposit amount\n" +
      `Withdraw Amount: ${withdrawAmountPrecise}   Vault Balance: ${vaultBalPre}`
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
      // vault
      userlpSaber.vault,
      // mint pubKey
      accounts.lpSaberUsdcUsdt.mint,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // globalState
      accounts.global
    )
  ).is.rejected;

  const vaultBalPost = Number(
    (await userlpSaber.vault.ata.getBalance()).value.amount
  );
  const diff = vaultBalPost - vaultBalPre;

  assert(
    diff == 0,
    "Withdraw did not fail when attempting to withdraw more tokens than are in the vault"
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
  const userVaultBalPre = Number(
    (await userlpSaber.vault.ata.getBalance()).value.amount
  );
  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);
  const otherUserVaultBalPre = Number(
    (await otherUserlpSaber.vault.ata.getBalance()).value.amount
  );
  const otherUserBalPre = Number(
    (await otherUserlpSaber.ata.getBalance()).value.amount
  );

  assert(
    withdrawAmountPrecise <= userVaultBalPre,
    "Test requires attempting to withdraw tokens <= that in the vault. Please decrease withdraw amount\n" +
      `\nWithdraw Amount:: ${withdrawAmountPrecise}  Vault Balance: ${userVaultBalPre}`
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
      // user vault
      // note: not other user vault since other user is trying to withdraw from user's vault
      userlpSaber.vault,
      // mint pubKey
      accounts.lpSaberUsdcUsdt.mint,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith(
    "2006", // ConstraintSeeds: a seeds constraint was violated
    "No error thrown when trying to withdraw from another user's vault"
  );

  const userVaultBalPost = Number(
    (await userlpSaber.vault.ata.getBalance()).value.amount
  );
  const userBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  const otherUserVaultBalPost = Number(
    (await otherUserlpSaber.vault.ata.getBalance()).value.amount
  );
  const otherUserBalPost = Number(
    (await otherUserlpSaber.ata.getBalance()).value.amount
  );

  console.log("heliere\n\n\n\n", userVaultBalPre - userVaultBalPost);
  const userVaultDiff = userVaultBalPre - userVaultBalPost;
  const userBalDiff = userBalPost - userBalPre;
  const otherUserVaultDiff = otherUserVaultBalPre - otherUserVaultBalPost;
  const otherUserBalDiff = otherUserBalPost - otherUserBalPre;

  assert(
    userVaultDiff === 0,
    "Tokens were withdrawn from base-user's vault by test-user. Major security bug."
  );
  assert(
    userBalDiff === 0,
    "User ATA balance has changed after an attempted withdrawal from another user"
  );
  assert(
    otherUserVaultDiff === 0,
    "Other user vault balance changed when attempting to withdraw from user's vault"
  );
  assert(
    otherUserBalDiff === 0,
    "Other user was successful in withdrawing from user's vault. Major security bug."
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
  const vaultBalPre = Number(
    (await userlpSaber.vault.ata.getBalance()).value.amount
  );
  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);

  // let globalStateAcct: IdlAccounts<StablePool>["globalState"] = await accounts.global.getAccount();
  // const tvlPre = globalStateAcct.tvlUsd.toNumber();

  assert(
    withdrawAmountPrecise <= vaultBalPre,
    "Test requires withdrawing an amount less than the vault balance so it will succeed.\n" +
      `Withdraw Amount: ${withdrawAmountPrecise}   Vault Balance: ${vaultBalPre}`
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
    // vault
    userlpSaber.vault,
    // mint pubKey
    accounts.lpSaberUsdcUsdt.mint,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // globalState
    accounts.global
  );

  // check balances after
  const vaultBalPost = Number(
    (await userlpSaber.vault.ata.getBalance()).value.amount
  );
  const userBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  const userDiff = userBalPost - userBalPre;
  const vaultDiff = vaultBalPost - vaultBalPre;
  console.log(`user balance: ${userBalPre} -> ${userBalPost} ∆=${userDiff}`);
  console.log(
    `vault balance: ${vaultBalPre} -> ${vaultBalPost} ∆=${vaultDiff}`
  );

  const differenceThreshold = 0.0001; // set arbitrarily
  assert(
    Math.abs(userDiff - withdrawAmountPrecise) < differenceThreshold,
    `Expected User ATA Diff: ${withdrawAmountPrecise}` +
      `Actual User ATA Diff: ${userDiff}`
  );
  assert(
    Math.abs(vaultDiff + withdrawAmountPrecise) < differenceThreshold,
    `Expected User Vault Diff: ${userDiff}` +
      `Actual User Vault Diff: ${vaultDiff}`
  );

  // globalStateAcct = await accounts.global.getAccount();
  // const tvlPost = globalStateAcct.tvlUsd.toNumber();
  // // may need to change from == to <= some small delta value to account for price flucuations
  // assert(tvlPre - tvlPost == withdrawAmount * LAMPORTS_PER_SOL* priceUsd,
  //   "TVL did not update correctly.\n" +
  //   "Expected TVL Difference: " + withdrawAmount * LAMPORTS_PER_SOL* priceUsd +
  //   " Actual TVL Difference: " + (tvlPre - tvlPost));
};
