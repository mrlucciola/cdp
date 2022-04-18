// anchor/solana
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
// utils
import { assert, expect } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import { addZeros, handleTxn } from "../utils/fxns";
import { DECIMALS_PRICE, DECIMALS_USDCUSDT } from "../utils/constants";
// interfaces
import { MintPubKey } from "../utils/interfaces";
import { User } from "../interfaces/user";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";
import { TokenCollatUser } from "../interfaces/TokenCollatUser";
import { GlobalState } from "../interfaces/GlobalState";
import { Miner } from "../interfaces/miner";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * * we have params and their classes like this so we can guarantee-
 *     we are passing in the right values
 */
export const depositCollateralCall = async (
  amtToDeposit: number,
  userConnection: Connection,
  userWallet: Wallet,
  tokenCollatUser: TokenCollatUser,
  vault: Vault,
  mintCollatPubKey: MintPubKey,
  pool: Pool,
  globalState: GlobalState,
  user: User,
  miner: Miner
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.depositCollateral(new BN(amtToDeposit), {
      accounts: {
        authority: userWallet.publicKey, //
        globalState: globalState.pubKey, //
        pool: pool.pubKey, //
        // user-derived accounts
        userState: user.userState.pubKey,
        vault: vault.pubKey, //
        // A.T.A.s
        ataCollatUser: tokenCollatUser.ata.pubKey, //
        ataCollatVault: vault.ataCollat.pubKey, //
        ataCollatMiner: miner.ata.pubKey, //
        mintCollat: mintCollatPubKey,
        oracleA: pool.oracles.usdc.pubKey,
        oracleB: pool.oracles.usdt.pubKey,
        ataMarketA: pool.ataMarketTokens.usdc.pubKey,
        ataMarketB: pool.ataMarketTokens.usdt.pubKey,
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
  const amtToDeposit = addZeros(0.9, DECIMALS_USDCUSDT);
  const ataBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);

  assert(
    amtToDeposit > ataBalPre,
    "Test requires attempting to deposit more tokens than in the ATA. Please increase deposit amount"
  );

  await expect(
    depositCollateralCall(
      // amt to deposit
      amtToDeposit,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // user token
      user.tokens.lpSaber,
      // vault
      user.tokens.lpSaber.vault,
      // mint pubKey
      accounts.lpSaberUsdcUsdt.mint,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // globalState
      accounts.global,
      user,
      user.tokens.lpSaber.vault.miner
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
  // mint tokens to the user's account first
  await user.tokens.lpSaber.ata.mintToAta(addZeros(10000, DECIMALS_USDCUSDT));

  // amt of collateral to deposit with precision
  const amtToDeposit = addZeros(1000, DECIMALS_USDCUSDT);

  // price, with precision
  // const priceUsd = 1.02 * 10 ** DECIMALS_PRICE; // TODO: fix price feed
  // const globalStateAcct: IdlAccounts<StablePool>["globalState"] =
  //   await accounts.global.getAccount();

  const userlpSaber = user.tokens.lpSaber;

  // const tvlPre = globalStateAcct.tvlUsd.toNumber();
  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);
  const vaultBalPre = Number(
    (await userlpSaber.vault.ataCollat.getBalance()).value.amount
  );

  assert(
    userBalPre >= amtToDeposit,
    "Test requires ATA balance to be >= deposit amount. Please increase deposit amount" +
      `\nATA bal.: ${userBalPre}   deposit amt: ${amtToDeposit}`
  );
  const doesExist = await user.tokens.lpSaber.vault.miner.ata.getAccountInfo();
  !doesExist &&
    (await user.tokens.lpSaber.vault.miner.ata.initAta(
      0,
      user.wallet,
      user.provider.connection
    ));
  // assert(
  //   amtToDeposit * LAMPORTS_PER_SOL * priceUsd + globalStateAcct.tvlUsd.toNumber() < globalStateAcct.tvlLimit.toNumber(),
  //   "Amount attempting to deposit will exceed TVL limit. Please decrease amtToDeposit.\n" +
  //   "Deposit Amount USD: " + (amtToDeposit * priceUsd * LAMPORTS_PER_SOL) + " TVL: " + globalStateAcct.tvlUsd.toNumber() +
  //   " TVL Limit: " + globalStateAcct.tvlLimit.toNumber());

  await depositCollateralCall(
    // deposit amount
    amtToDeposit,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // user token
    user.tokens.lpSaber,
    // vault
    user.tokens.lpSaber.vault,
    // mint pubKey
    accounts.lpSaberUsdcUsdt.mint,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // globalState
    accounts.global,
    user,
    user.tokens.lpSaber.vault.miner
  );

  const userBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  const vaultBalPost = Number(
    (await userlpSaber.vault.ataCollat.getBalance()).value.amount
  );
  const userDiff = userBalPost - userBalPre;
  const vaultDiff = vaultBalPost - vaultBalPre;
  console.log(`user balance: ${userBalPre} -> ${userBalPost} ∆=${userDiff}`);
  console.log(
    `vault balance: ${vaultBalPre} -> ${vaultBalPost} ∆=${vaultDiff}`
  );

  const differenceThreshold = 0.0001; // set arbitrarily
  assert(
    Math.abs(amtToDeposit + userDiff) < differenceThreshold,
    "Expected User ATA Diff: " +
      -amtToDeposit +
      " Actual User ATA Diff: " +
      userDiff
  );
  assert(
    Math.abs(vaultDiff - amtToDeposit) < differenceThreshold,
    "Expected Vault Diff: " + amtToDeposit + " Actual Vault Diff: " + vaultDiff
  );
  // globalStateAcct = await accounts.global.getAccount();
  // const tvlPost = globalStateAcct.tvlUsd.toNumber();
  // // may need to change from == to <= some small delta value to account for price flucuations
  // assert(tvlPost - tvlPre == amtToDeposit * LAMPORTS_PER_SOL* priceUsd,
  //   "TVL did not update correctly.\n" +
  //   "Expected TVL Difference: " + amtToDeposit * LAMPORTS_PER_SOL* priceUsd +
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
    "Amount attempting to deposit will not exceed TVL limit. Please increase amtToDeposit.\n" +
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
      // vault
      user.tokens.lpSaber.vault,
      // mint pubKey
      accounts.lpSaberUsdcUsdt.mint,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // globalState
      accounts.global,
      user,
      user.tokens.lpSaber.vault.miner
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
