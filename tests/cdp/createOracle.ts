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
import { Oracle } from "../utils/interfaces";
import { Accounts } from "../config/accounts";
// program
const programStablePool = workspace.StablePool as Program<StablePool>;

const createOracleCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  oracle: Oracle
) => {
  const txn = new web3.Transaction().add(
    programStablePool.instruction.createOracle(
      // price of token
      new BN(oracle.price),
      {
        accounts: {
          authority: userWallet.publicKey,
          globalState: accounts.global.pubKey,
          oracle: oracle.pubKey,
          mint: oracle.mint,
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
 * Pass when attempting to make a oracle that doesn't exist
 * @param userConnection
 * @param userWallet
 * @param accounts
 * @param oracle
 */
export const createOraclePASS = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  oracle: Oracle
) => {
  // derive oracle account
  console.log("getting oracle acct");

  // get oracle info
  const oracleInfo: web3.AccountInfo<Buffer> = await oracle.getAccountInfo();

  // if not created, create oracle
  if (!oracleInfo) {
    const confirmation = await createOracleCall(
      userConnection,
      userWallet,
      accounts,
      oracle
    );
    console.log("created oracle: ", confirmation);
  } else console.log("this oracle already created");

  // get the oracle state
  const oracleAcct: IdlAccounts<StablePool>["oracle"] =
    await oracle.getAccount();
  // final asserts
  assert(oracleAcct.price.toNumber() == oracle.price, "price mismatch");
};

/**
 * Fail when attempting to create a oracle that already exists
 * @param userConnection
 * @param accounts
 * @param userWallet
 * @param oracle
 */
export const createOracledFAIL_Duplicate = async (
  userConnection: Connection,
  userWallet: Wallet,
  accounts: Accounts,
  oracle: Oracle
) => {
  // get oracle info
  const oracleInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(oracle.pubKey);
  // if oracle created, try to create another one for the same mint (should fail)
  assert(oracleInfo, "Oracle does not exist, test needs a oracle");
  await expect(
    createOracleCall(userConnection, userWallet, accounts, oracle),
    "No error was thrown was trying to create a duplicate oracle"
  ).is.rejected;
};