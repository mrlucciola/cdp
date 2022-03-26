import {
  BN,
  IdlAccounts,
  Program,
  Wallet,
  workspace,
} from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Transaction } from "@solana/web3.js";
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
import { assert, expect } from "chai";
import { DECIMALS_PRICE, DECIMALS_USDCUSDT } from "../utils/constants";

const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * * we have params and their classes like this so we can guarantee-
 *     we are passing in the right values
 * @param depositAmount
 * @param userWallet
 * @param userToken
 * @param mintPubKey
 * @param trove
 * @param vault
 * @param globalState
 */
const depositCollateralCall = async (
  depositAmount: number,
  userConnection: Connection,
  userWallet: Wallet,
  userToken: UserToken,
  trove: Trove,
  mintPubKey: MintPubKey,
  vault: Vault,
  globalState: GlobalStateAcct
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.depositCollateral(new BN(depositAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        vault: vault.pubKey,
        trove: trove.pubKey,
        ataTrove: trove.ata.pubKey,
        ataUser: userToken.ata.pubKey,
        mintCollat: mintPubKey,
        oracleA: vault.oracles.usdc.pubKey,
        oracleB: vault.oracles.usdt.pubKey,
        ataMarketA: vault.ataMarketTokens.usdc.pubKey,
        ataMarketB: vault.ataMarketTokens.usdt.pubKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
};

export const depositCollateralFAIL_NotEnoughTokens = async (
  user: User,
  accounts: Accounts
) => {
  const userlpSaber = user.tokens.lpSaber;
  const depositAmount = 0.9 * 10 ** DECIMALS_USDCUSDT;
  const ataBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);

  assert(
    depositAmount > ataBalPre,
    "Test requires attempting to deposit more tokens than in the ATA. Please increase deposit amount"
  );

  await expect(
    depositCollateralCall(
      // deposit amount
      depositAmount,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // user token
      user.tokens.lpSaber,
      // trove
      user.tokens.lpSaber.trove,
      // mint pubKey
      accounts.lpSaberUsdcUsdt.mint,
      // vault
      accounts.lpSaberUsdcUsdt.vault,
      // globalState
      accounts.global
    ),
    "No error was thrown when trying to deposit an amount greater than the user's balance"
  ).is.rejected;

  const ataBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  const diff = ataBalPost - ataBalPre;

  assert(
    diff == 0,
    "Deposit did not fail when trying to deposit more tokens than in the user's ATA"
  );
};

export const depositCollateralPASS = async (user: User, accounts: Accounts) => {
  // amt to deposit with precision
  const depositAmount = 0.2 * 10 ** DECIMALS_USDCUSDT;
  // price, with precision
  const priceUsd = 1.02 * 10 ** DECIMALS_PRICE; // TODO: fix price feed
  const globalStateAcct: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();

  const userlpSaber = user.tokens.lpSaber;

  // const tvlPre = globalStateAcct.tvlUsd.toNumber();
  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);
  const troveBalPre = Number(
    (await userlpSaber.trove.ata.getBalance()).value.amount
  );

  assert(
    userBalPre >= depositAmount,
    "Test requires ATA balance to be >= deposit amount. Please increase deposit amount" +
      `\nATA bal.: ${userBalPre}   deposit amt: ${depositAmount}`
  );
  // assert(
  //   depositAmount * LAMPORTS_PER_SOL * priceUsd + globalStateAcct.tvlUsd.toNumber() < globalStateAcct.tvlLimit.toNumber(),
  //   "Amount attempting to deposit will exceed TVL limit. Please decrease depositAmount.\n" +
  //   "Deposit Amount USD: " + (depositAmount * priceUsd * LAMPORTS_PER_SOL) + " TVL: " + globalStateAcct.tvlUsd.toNumber() +
  //   " TVL Limit: " + globalStateAcct.tvlLimit.toNumber());

  await depositCollateralCall(
    // deposit amount
    depositAmount,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // user token
    user.tokens.lpSaber,
    // trove
    user.tokens.lpSaber.trove,
    // mint pubKey
    accounts.lpSaberUsdcUsdt.mint,
    // vault
    accounts.lpSaberUsdcUsdt.vault,
    // globalState
    accounts.global
  );

  const userBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  const troveBalPost = Number(
    (await userlpSaber.trove.ata.getBalance()).value.amount
  );
  const userDiff = userBalPost - userBalPre;
  const troveDiff = troveBalPost - troveBalPre;
  console.log(`user balance: ${userBalPre} -> ${userBalPost} ∆=${userDiff}`);
  console.log(
    `trove balance: ${troveBalPre} -> ${troveBalPost} ∆=${troveDiff}`
  );

  const differenceThreshold = 0.0001; // set arbitrarily
  assert(
    Math.abs(depositAmount + userDiff) < differenceThreshold,
    "Expected User ATA Diff: " +
      -depositAmount +
      " Actual User ATA Diff: " +
      userDiff
  );
  assert(
    Math.abs(troveDiff - depositAmount) < differenceThreshold,
    "Expected Trove Diff: " + depositAmount + " Actual Trove Diff: " + troveDiff
  );
  // globalStateAcct = await accounts.global.getAccount();
  // const tvlPost = globalStateAcct.tvlUsd.toNumber();
  // // may need to change from == to <= some small delta value to account for price flucuations
  // assert(tvlPost - tvlPre == depositAmount * LAMPORTS_PER_SOL* priceUsd,
  //   "TVL did not update correctly.\n" +
  //   "Expected TVL Difference: " + depositAmount * LAMPORTS_PER_SOL* priceUsd +
  //   " Actual TVL Difference: " + (tvlPost - tvlPre));
};

// TODO: unit test doesn't work (although passing) because TVL prices aren't implemented
export const depositCollateralFAIL_DepositExceedingTVL = async (
  user: User,
  accounts: Accounts
) => {
  const depositAmountUi = 2;
  const depositAmountPrecise = depositAmountUi * 10 ** DECIMALS_USDCUSDT;
  const priceUsdUi = 1.02; // placeholder, get from price feed
  const priceUsdPrecise = priceUsdUi * 10 ** DECIMALS_PRICE;
  const userlpSaber = user.tokens.lpSaber;
  const ataBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);

  const globalStateAcct: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();
  const tvlPre = globalStateAcct.tvlUsd;

  assert(
    ataBalPre >= depositAmountPrecise,
    "Starting balance < amount of tokens trying to be deposited. Please increase tokens in ATA.\n" +
      "ATA Balance:" +
      ataBalPre +
      " Deposit Amount: " +
      depositAmountPrecise
  );
  assert(
    depositAmountPrecise * priceUsdPrecise + globalStateAcct.tvlUsd.toNumber() >
      globalStateAcct.tvlLimit.toNumber(),
    "Amount attempting to deposit will not exceed TVL limit. Please increase depositAmount.\n" +
      `Deposit Amount USD: ${depositAmountPrecise * priceUsdPrecise}\n` +
      `TVL: ${globalStateAcct.tvlUsd.toNumber()}   TVL Limit: ${globalStateAcct.tvlLimit.toNumber()}`
  );

  // console.log(`tvlLimit: ${globalStateAcct.tvlLimit.toNumber()}`);
  // console.log(`tvlUsd: ${globalStateAcct.tvlUsd.toNumber()}`);
  // console.log(
  //   `depositAmountPrecise * 100000: ${depositAmountPrecise * 100000}`
  // );
  await expect(
    depositCollateralCall(
      // deposit amount
      depositAmountPrecise * 100000,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // user token
      user.tokens.lpSaber,
      // trove
      user.tokens.lpSaber.trove,
      // mint pubKey
      accounts.lpSaberUsdcUsdt.mint,
      // vault
      accounts.lpSaberUsdcUsdt.vault,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith(
    "6016",
    "No error was thrown when trying to deposit an amount greater the platform's TVL"
  );

  const ataBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  const diff = ataBalPost - ataBalPre;

  assert(
    diff === 0,
    "Deposit failed but token balance changed after deposit attempt"
  );

  const tvlPost = (await accounts.global.getAccount()).tvlUsd;
  // this might have to be adjusted so that pre - post < small value (due to price fluctuations)
  assert(
    tvlPre.toNumber() - tvlPost.toNumber() === 0,
    "TVL changed after failed deposit when it should've stayed the same"
  );
};
