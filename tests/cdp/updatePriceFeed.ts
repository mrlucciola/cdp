// anchor imports
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
// solana imports
// utils
import { assert, expect } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import { handleTxn } from "../utils/fxns";
import { MintPubKey, PriceFeed } from "../utils/interfaces"; // TODO: price-feed -> oracle
import { Accounts } from "../config/accounts";
// program
const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * This fxn isnt properly annotated.
 * @param userConnection
 * @param userWallet
 * @param accounts
 * @param priceFeed// TODO: price-feed -> oracle
 * @returns
 */
const updatePriceFeedCall = async (
  // TODO: price-feed -> oracle
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  priceFeed: PriceFeed // TODO: price-feed -> oracle
) => {
  const txn = new web3.Transaction().add(
    programStablePool.instruction.reportPrice(
      // price of token
      new BN(priceFeed.price), // TODO: price-feed -> oracle
      {
        accounts: {
          authority: userWallet.publicKey,
          globalState: accounts.global.pubKey,
          priceFeed: priceFeed.pubKey, // TODO: price-feed -> oracle
          mint: priceFeed.mint, // TODO: price-feed -> oracle
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
 * @param priceFeed// TODO: price-feed -> oracle
 */
// TODO: price-feed -> oracle
export const updatePriceFeedPASS = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  priceFeed: PriceFeed, // TODO: price-feed -> oracle
  newPrice: number
) => {
  priceFeed.price = newPrice; // TODO: price-feed -> oracle
  // derive price feed account
  console.log("getting price feed acct");

  // get price feed info
  // TODO: price-feed -> oracle
  const priceFeedInfo: web3.AccountInfo<Buffer> =
    await priceFeed.getAccountInfo();

  // if not created, create price feed
  // TODO: price-feed -> oracle
  if (priceFeedInfo) {
    // TODO: price-feed -> oracle
    const confirmation = await updatePriceFeedCall(
      userConnection,
      userWallet,
      accounts,
      priceFeed // TODO: price-feed -> oracle
    );
    console.log("updated price feed: ", confirmation);
  } else console.log("this price feed was not created");

  // get the price feed state
  // TODO: price-feed -> oracle
  const priceFeedAcc: IdlAccounts<StablePool>["priceFeed"] =
    await priceFeed.getAccount();
  // asserts
  // TODO: price-feed -> oracle
  assert(priceFeedAcc.price.toNumber() == newPrice, "price mismatch");
};

/**
 * Fail when attempting to make a price feed that already exists
 * @param userConnection
 * @param userWallet
 * @param accounts
 * @param priceFeed// TODO: price-feed -> oracle
 */
// TODO: price-feed -> oracle
export const updatePriceFeedFAIL_NotUpdater = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  priceFeed: PriceFeed, // TODO: price-feed -> oracle
  newPrice: number
) => {
  priceFeed.price = newPrice; // TODO: price-feed -> oracle
  // get price feed info
  // TODO: price-feed -> oracle
  const priceFeedInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(priceFeed.pubKey);
  // TODO: price-feed -> oracle
  assert(priceFeedInfo, "Price feed does not exist, test needs a price feed");

  // get the price feed state
  const priceFeedAccBefore: IdlAccounts<StablePool>["priceFeed"] =
    await priceFeed.getAccount(); // TODO: price-feed -> oracle

  await expect(
    // TODO: price-feed -> oracle
    updatePriceFeedCall(userConnection, userWallet, accounts, priceFeed),
    "No error was thrown was trying to update price feed by not updater"
  ).is.rejected;

  // get the price feed state
  // TODO: price-feed -> oracle
  const priceFeedAcc: IdlAccounts<StablePool>["priceFeed"] =
    await priceFeed.getAccount();
  // asserts
  assert(
    // TODO: price-feed -> oracle
    priceFeedAcc.price.toNumber() == priceFeedAccBefore.price.toNumber(),
    "price mismatch"
  );
};
