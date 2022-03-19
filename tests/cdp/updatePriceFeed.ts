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
  import { MintPubKey, PriceFeed } from "../utils/interfaces";
import { Accounts } from "../config/accounts";
  // program
  const programStablePool = workspace.StablePool as Program<StablePool>;
  
  /**
   *
   * @param userConnection
   * @param userWallet
   * @param accounts
   * @param priceFeed
   * @returns
   */
  const updatePriceFeedCall = async (
    userConnection: Connection,
    userWallet: Wallet,
    accounts: Accounts,
    priceFeed: PriceFeed,
  ) => {
    const txn = new web3.Transaction().add(
      programStablePool.instruction.reportPrice(
        // price of token
        new BN(priceFeed.price),
        {
          accounts: {
            authority: userWallet.publicKey,
            globalState: accounts.global.pubKey,
            priceFeed: priceFeed.pubKey,
            mint: priceFeed.mint,
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
   * @param priceFeed
   */
  export const updatePriceFeedPASS = async (
    userConnection: Connection,
    userWallet: Wallet,
    accounts: Accounts,
    priceFeed: PriceFeed,
    newPrice: number
  ) => {
    priceFeed.price = newPrice
    // derive price feed account
    console.log("getting price feed acct");
  
    // get price feed info
    const priceFeedInfo: web3.AccountInfo<Buffer> = await priceFeed.getAccountInfo();
  
    // if not created, create price feed
    if (priceFeedInfo) {
      const confirmation = await updatePriceFeedCall(
        userConnection,
        userWallet,
        accounts,
        priceFeed,
      );
      console.log("updated price feed: ", confirmation);
    } else console.log("this price feed was not created");

    // get the price feed state
    const priceFeedAcc: IdlAccounts<StablePool>["priceFeed"] =
    await priceFeed.getAccount();
    // asserts
    assert(priceFeedAcc.price.toNumber() == newPrice, "price mismatch");
  };
  
  /**
   * Fail when attempting to make a price feed that already exists
   * @param userConnection
   * @param userWallet
   * @param accounts
   * @param priceFeed
   */
  export const updatePriceFeedFAIL_NotUpdater = async (
    userConnection: Connection,
    userWallet: Wallet,
    accounts: Accounts,
    priceFeed: PriceFeed,
    newPrice: number
  ) => {
    priceFeed.price = newPrice
    // get price feed info
    const priceFeedInfo: web3.AccountInfo<Buffer> =
      await getProvider().connection.getAccountInfo(priceFeed.pubKey);
  
    assert(priceFeedInfo, "Price feed does not exist, test needs a price feed");

    // get the price feed state
    const priceFeedAccBefore: IdlAccounts<StablePool>["priceFeed"] =
    await priceFeed.getAccount();


    await expect(
      updatePriceFeedCall(
        userConnection,
        userWallet,
        accounts,
        priceFeed,
      ),
      "No error was thrown was trying to update price feed by not updater"
    ).is.rejected;
  
    // get the price feed state
    const priceFeedAcc: IdlAccounts<StablePool>["priceFeed"] =
    await priceFeed.getAccount();
    // asserts
    assert(priceFeedAcc.price.toNumber() == priceFeedAccBefore.price.toNumber(), "price mismatch");
  };
  