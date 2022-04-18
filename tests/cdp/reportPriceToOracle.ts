// anchor/solana imports
import {
  getProvider,
  Program,
  web3,
  workspace,
  BN,
  Wallet,
  IdlAccounts,
} from "@project-serum/anchor";
import { Connection, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
// utils
import { assert, expect } from "chai";
// local
import { handleTxn } from "../utils/fxns";
import { Accounts } from "../config/accounts";
import { StablePool } from "../../target/types/stable_pool";
// interfaces
import { User } from "../interfaces/user";
import { Oracle } from "../interfaces/oracle";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * This fxn isnt properly annotated.
 * @param userConnection
 * @param userWallet
 * @param accounts
 * @param oracle
 * @returns
 */
const reportPriceToOracleCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  oracle: Oracle,
  newPrice: number
) => {
  const txn = new web3.Transaction().add(
    programStablePool.instruction.reportPriceToOracle(
      // price of token
      new BN(newPrice),
      {
        accounts: {
          authority: userWallet.publicKey,
          globalState: accounts.global.pubKey,
          oracle: oracle.pubKey,
          mint: oracle.mint,
          clock: SYSVAR_CLOCK_PUBKEY,
        },
      }
    )
  );

  // send transaction
  const receipt = await handleTxn(txn, userConnection, userWallet);

  return receipt;
};

export const reportPriceToOraclePASS = async (
  oracleReporter: User,
  // oracleReporterConnection: Connection, // userConnection
  // oracleReporterWallet: Wallet, // userWallet
  accounts: Accounts,
  newPrice: number = 1.01
) => {
  // derive price feed account
  console.log("getting price feed acct");

  // get price feed info
  const priceFeedInfo: web3.AccountInfo<Buffer> =
    await accounts.usdc.oracle.getAccountInfo();

  // if not created, create price feed
  if (priceFeedInfo) {
    const confirmation = await reportPriceToOracleCall(
      oracleReporter.provider.connection,
      oracleReporter.wallet,
      accounts,
      accounts.usdc.oracle,
      newPrice
    );
    console.log("updated price feed: ", confirmation);
  } else console.log("this price feed was not created");

  // get the price feed state
  const priceFeedAcc: IdlAccounts<StablePool>["oracle"] =
    await accounts.usdc.oracle.getAccount();
  // asserts
  assert(priceFeedAcc.price.toNumber() == newPrice, "price mismatch");
};

/**
 * Fail when attempting to make a price feed that already exists
 *
 * @param userConnection
 * @param userWallet
 * @param accounts
 * @param oracle
 */
export const reportPriceToOracleFAIL_NotUpdater = async (
  userBase: User,
  // userConnection: Connection,
  // userWallet: Wallet,
  accounts: Accounts,
  newPrice: number
) => {
  // get price feed info
  const priceFeedInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(accounts.usdc.oracle.pubKey);
  assert(priceFeedInfo, "Price feed does not exist, test needs a price feed");

  // get the price feed state
  const priceFeedAccBefore: IdlAccounts<StablePool>["oracle"] =
    await accounts.usdc.oracle.getAccount();

  await expect(
    reportPriceToOracleCall(
      userBase.provider.connection,
      userBase.wallet,
      accounts,
      accounts.usdc.oracle,
      newPrice
    ),
    "No error was thrown was trying to update oracle by not oracle reporter"
  ).is.rejected;

  // get the price feed state
  const priceFeedAcc: IdlAccounts<StablePool>["oracle"] =
    await accounts.usdc.oracle.getAccount();
  // asserts
  assert(
    priceFeedAcc.price.toNumber() == priceFeedAccBefore.price.toNumber(),
    "price mismatch"
  );
};
