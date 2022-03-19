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
  import { Connection, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
  // solana imports
  import {
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";
  // utils
  import { assert, expect } from "chai";
  // local
  import { StablePool } from "../../target/types/stable_pool";
  import { handleTxn } from "../utils/fxns";
  import { MintPubKey, PriceFeed, Vault } from "../utils/interfaces";
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
  const createOracleCall = async (
    userConnection: Connection,
    userWallet: Wallet,
    accounts: Accounts,
    priceFeed: PriceFeed,
  ) => {
    const txn = new web3.Transaction().add(
      programStablePool.instruction.createOracle(
        // price of token
        new BN(priceFeed.price),
        {
          accounts: {
            authority: userWallet.publicKey,
            globalState: accounts.global.pubKey,
            priceFeed: priceFeed.pubKey,
            mint: priceFeed.mint,
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
   * Pass when attempting to make a price feed that doesn't exist
   * @param userConnection
   * @param userWallet
   * @param accounts
   * @param priceFeed
   */
  export const createOraclePASS = async (
    userConnection: Connection,
    userWallet: Wallet,
    accounts: Accounts,
    priceFeed: PriceFeed,
  ) => {
    // derive price feed account
    console.log("getting price feed acct");
  
    // get price feed info
    const priceFeedInfo: web3.AccountInfo<Buffer> = await priceFeed.getAccountInfo();
  
    // if not created, create price feed
    if (!priceFeedInfo) {
      const confirmation = await createOracleCall(
        userConnection,
        userWallet,
        accounts,
        priceFeed,
      );
      console.log("created oracle: ", confirmation);
    } else console.log("this price feed already created");

    // get the price feed state
    const priceFeedAcc: IdlAccounts<StablePool>["priceFeed"] =
    await priceFeed.getAccount();
    // final asserts
    assert(priceFeedAcc.price.toNumber() == priceFeed.price, "price mismatch");
  };
  
  /**
   * Fail when attempting to create a oracle that already exists
   * @param userConnection
   * @param accounts
   * @param userWallet
   * @param priceFeed
   */
  export const createOracledFAIL_Duplicate = async (
    userConnection: Connection,
    userWallet: Wallet,
    accounts: Accounts,
    priceFeed: PriceFeed,
  ) => {
    // get price feed info
    const priceFeedInfo: web3.AccountInfo<Buffer> =
      await getProvider().connection.getAccountInfo(priceFeed.pubKey);
    // if price feed created, try to create another one for the same mint (should fail)
    assert(priceFeedInfo, "Price feed does not exist, test needs a price feed");
    await expect(
      createOracleCall(
        userConnection,
        userWallet,
        accounts,
        priceFeed,
      ),
      "No error was thrown was trying to create a duplicate price feed"
    ).is.rejected;
  };
  