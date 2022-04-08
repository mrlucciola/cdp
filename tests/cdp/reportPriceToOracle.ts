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
import { Oracle } from "../utils/interfaces";

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
  oracle: Oracle
) => {
  const txn = new web3.Transaction().add(
    programStablePool.instruction.reportPriceToOracle(
      // price of token
      new BN(oracle.price),
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

/**
 * Pass when attempting to make a price feed that doesn't exist
 * @param userConnection
 * @param userWallet
 * @param accounts
 * @param oracle
 */

export const reportPriceToOraclePASS = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  oracle: Oracle,
  newPrice: number
) => {
  oracle.price = newPrice;
  // derive price feed account
  console.log("getting price feed acct");

  // get price feed info
  const priceFeedInfo: web3.AccountInfo<Buffer> = await oracle.getAccountInfo();

  // if not created, create price feed
  if (priceFeedInfo) {
    const confirmation = await reportPriceToOracleCall(
      userConnection,
      userWallet,
      accounts,
      oracle
    );
    console.log("updated price feed: ", confirmation);
  } else console.log("this price feed was not created");

  // get the price feed state
  const priceFeedAcc: IdlAccounts<StablePool>["oracle"] =
    await oracle.getAccount();
  // asserts
  assert(priceFeedAcc.price.toNumber() == newPrice, "price mismatch");
};

/**
 * Fail when attempting to make a price feed that already exists
 * @param userConnection
 * @param userWallet
 * @param accounts
 * @param oracle
 */
export const reportPriceToOracleFAIL_NotUpdater = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  oracle: Oracle,
  newPrice: number
) => {
  oracle.price = newPrice;
  // get price feed info
  const priceFeedInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(oracle.pubKey);
  assert(priceFeedInfo, "Price feed does not exist, test needs a price feed");

  // get the price feed state
  const priceFeedAccBefore: IdlAccounts<StablePool>["oracle"] =
    await oracle.getAccount();

  await expect(
    reportPriceToOracleCall(userConnection, userWallet, accounts, oracle),
    "No error was thrown was trying to update oracle by not oracle reporter"
  ).is.rejected;

  // get the price feed state
  const priceFeedAcc: IdlAccounts<StablePool>["oracle"] =
    await oracle.getAccount();
  // asserts
  assert(
    priceFeedAcc.price.toNumber() == priceFeedAccBefore.price.toNumber(),
    "price mismatch"
  );
};
