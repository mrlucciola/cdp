// This file should be renamed to create-oracle
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
import {
  Connection,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
// solana imports
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import { handleTxn } from "../utils/fxns";
import { PriceFeed } from "../utils/interfaces"; // TODO: price-feed -> oracle
import { Accounts } from "../config/accounts";
// program
const programStablePool = workspace.StablePool as Program<StablePool>;

const createOracleCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  priceFeed: PriceFeed// TODO: price-feed -> oracle
) => {
  const txn = new web3.Transaction().add(
    programStablePool.instruction.createOracle(
      // price of token
      new BN(priceFeed.price),// TODO: price-feed -> oracle
      {
        accounts: {
          authority: userWallet.publicKey,
          globalState: accounts.global.pubKey,
          priceFeed: priceFeed.pubKey,// TODO: price-feed -> oracle
          mint: priceFeed.mint,// TODO: price-feed -> oracle
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: SYSVAR_CLOCK_PUBKEY,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        },
      }
    )
  );

  // send transaction
  const receipt = await handleTxn(txn, userConnection, userWallet);

  return receipt;
};

/**
 * This isnt even properly annotated.
 * Pass when attempting to make a price feed that doesn't exist
 * @param userConnection
 * @param userWallet
 * @param accounts
 * @param priceFeed// TODO: price-feed -> oracle
 */
export const createOraclePASS = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  priceFeed: PriceFeed// TODO: price-feed -> oracle
) => {
  // derive price feed account
  console.log("getting price feed acct");

  // get price feed info
  const priceFeedInfo: web3.AccountInfo<Buffer> =// TODO: price-feed -> oracle
    await priceFeed.getAccountInfo();

  // if not created, create price feed
  if (!priceFeedInfo) {// TODO: price-feed -> oracle
    const confirmation = await createOracleCall(
      userConnection,
      userWallet,
      accounts,
      priceFeed// TODO: price-feed -> oracle
    );
    console.log("created oracle: ", confirmation);
  } else console.log("this price feed already created");

  // get the price feed state
  const priceFeedAcc: IdlAccounts<StablePool>["priceFeed"] =// TODO: price-feed -> oracle
    await priceFeed.getAccount();// TODO: price-feed -> oracle
  // final asserts
  assert(priceFeedAcc.price.toNumber() == priceFeed.price, "price mismatch");// TODO: price-feed -> oracle
};

/**
 * Fail when attempting to create a oracle that already exists
 * @param userConnection
 * @param accounts
 * @param userWallet
 * @param priceFeed// TODO: price-feed -> oracle
 */
export const createOracledFAIL_Duplicate = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  priceFeed: PriceFeed// TODO: price-feed -> oracle
) => {
  // get price feed info
  const priceFeedInfo: web3.AccountInfo<Buffer> =// TODO: price-feed -> oracle
    await getProvider().connection.getAccountInfo(priceFeed.pubKey);// TODO: price-feed -> oracle
  // if price feed created, try to create another one for the same mint (should fail)
  assert(priceFeedInfo, "Price feed does not exist, test needs a price feed");// TODO: price-feed -> oracle
  await expect(
    createOracleCall(userConnection, userWallet, accounts, priceFeed),// TODO: price-feed -> oracle
    "No error was thrown was trying to create a duplicate price feed"
  ).is.rejected;
};
