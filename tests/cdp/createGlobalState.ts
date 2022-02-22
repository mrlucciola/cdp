// anchor imports
import {
  Provider,
  Program,
  web3,
  workspace,
  BN,
  IdlAccounts,
  ProgramError,
  IdlError,
} from "@project-serum/anchor";
import {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionError,
} from "@solana/web3.js";
// solana imports
import { TokenError, TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { handleTxn } from "../utils/fxns";
import * as constants from "../utils/constants";
import { User, Users } from "../config/users";
import { Accounts } from "../config/accounts";
import { StablePool } from "../../target/types/stable_pool";
import { errors } from "../utils/errors";

const programStablePool = workspace.StablePool as Program<StablePool>;

const createGlobalStateCall = async (accounts: Accounts, user: User) => {
  // create txn
  const txn = new web3.Transaction();
  // add instruction
  txn.add(
    programStablePool.instruction.createGlobalState(
      accounts.global.bump, // prev: globalStateNonce
      accounts.mintUsdx.bump, // prev: mintUsdNonce
      new BN(constants.TVL_LIMIT),
      new BN(constants.GLOBAL_DEBT_CEILING),
      {
        accounts: {
          authority: user.wallet.publicKey,
          globalState: accounts.global.pubKey,
          mintUsdx: accounts.mintUsdx.pubKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }
    )
  );

  // send transaction
  try {
    const receipt = await handleTxn(txn, user);
    console.log("Global state creation confirmed: ", receipt);
    return receipt;
  } catch (error) {
    const idlErrors = new Map(
      errors.map((e) => [e.code, `${e.name}: ${e.msg}`])
    );
    const translatedErr = ProgramError.parse(error, idlErrors);
    throw translatedErr;
  }
};

/**
 * Creates global state account and usdx mint account
 * auth needs to be 7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi, this will fail otherwise
 * @param accounts
 * @param superUser
 */
export const createGlobalStatePASS = async (
  accounts: Accounts,
  superUser: User
) => {
  // create the global state account and mint account
  // check if global state exists. If not, create it
  const globalStateAccountInfo: web3.AccountInfo<Buffer> =
    await superUser.provider.connection.getAccountInfo(accounts.global.pubKey);
  if (!globalStateAccountInfo) {
    const receipt = await createGlobalStateCall(accounts, superUser);
  } else console.log("GLOBAL STATE ALREADY CREATED", globalStateAccountInfo);

  // check if global state exists
  const globalState: IdlAccounts<StablePool>["globalState"] =
    await programStablePool.account.globalState.fetch(accounts.global.pubKey);
  console.log("global state account: ", globalState);

  // add to the account state
  accounts.global.state = globalState;

  // testing if each of the global state's parameters exists
  assert(
    globalState.authority.toBase58() == superUser.wallet.publicKey.toBase58(),
    "\n auth is not user.super"
  );
  assert(
    accounts.global.state.mintUsdx.toBase58() ==
      accounts.mintUsdx.pubKey.toBase58(),
    "\n USDx mint is not correct"
  );
  assert(
    globalState.tvlLimit.toNumber() == constants.TVL_LIMIT,
    `Global-state TVL Limit: ${globalState.tvlLimit} \nTVL Limit: ${constants.TVL_LIMIT}`
  );
  assert(globalState.tvl.toNumber() == 0, "Err: Global-state.tvl != 0");
  assert(
    globalState.totalDebt.toNumber() == 0,
    "Err: Global-state-total-debt != 0"
  );
  assert(
    globalState.debtCeiling.toNumber() == constants.GLOBAL_DEBT_CEILING,
    `GlobalState Debt Ceiling: ${globalState.debtCeiling} Debt Ceiling: ${constants.GLOBAL_DEBT_CEILING}`
  );
};

/**
 * In this FAIL test - auth is not 7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi
 * Verify that the user being passed into the fxn is not super
 * @param accounts
 * @param notSuperUser
 */
export const createGlobalStateFAIL_auth = async (
  accounts: Accounts,
  notSuperUser: User
) => {
  assert(
    notSuperUser.wallet.publicKey.toString() !==
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this fail test, do not use super user account"
  );
  // create the global state account and mint account
  // check if global state exists. If not, create it
  const globalStateAccountInfo: web3.AccountInfo<Buffer> =
    await notSuperUser.provider.connection.getAccountInfo(
      accounts.global.pubKey
    );

  assert(
    !globalStateAccountInfo,
    "Please place test before global state account creation"
  );
  // 2003 = ConstraintRaw - the check that says pubkey needs to == superuser
  await expect(
    createGlobalStateCall(accounts, notSuperUser)
  ).to.be.rejectedWith("2003");
};

/**
 * In this FAIL test - we try to create a new global state when it already exists
 * @param accounts
 * @param superUser
 */
export const createGlobalStateFAIL_duplicate = async (
  accounts: Accounts,
  superUser: User
) => {
  // check if global state exists. It should exist for this test
  const globalStateAccountInfo: web3.AccountInfo<Buffer> =
    await superUser.provider.connection.getAccountInfo(accounts.global.pubKey);

  assert(
    globalStateAccountInfo,
    "Please place test after global state account creation"
  );

  // { code: 0, byte: 0x0, name: "AlreadyInUse", msg: "Already in use" },
  await expect(createGlobalStateCall(accounts, superUser)).to.be.rejectedWith(
    "0"
  );
  console.log('^ this is failing correctly, as expected');
};
