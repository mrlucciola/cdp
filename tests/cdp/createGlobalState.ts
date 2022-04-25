// anchor/solana imports
import {
  Program,
  web3,
  workspace,
  BN,
  IdlAccounts,
} from "@project-serum/anchor";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { addZeros, handleTxn } from "../utils/fxns";
import {
  DEBT_CEILING_GLOBAL_USDX,
  DEBT_CEILING_USER_USDX,
  DECIMALS_USD,
  DECIMALS_USDX,
  TVL_LIMIT_USD,
} from "../utils/constants";
import { Accounts } from "../config/accounts";
import { StablePool } from "../../target/types/stable_pool";
import { User } from "../interfaces/user";

const programStablePool = workspace.StablePool as Program<StablePool>;

const createGlobalStateCall = async (
  accounts: Accounts,
  user: User,
  oracleReporter: User
) => {
  // create txn
  const txn = new web3.Transaction();
  // add instruction
  txn.add(
    programStablePool.instruction.createGlobalState(
      new BN(addZeros(TVL_LIMIT_USD, DECIMALS_USD)), // tvl_limit
      new BN(addZeros(DEBT_CEILING_GLOBAL_USDX, DECIMALS_USDX)), // global_debt_ceiling
      new BN(addZeros(DEBT_CEILING_USER_USDX, DECIMALS_USDX)), // debt_ceiling_user prev: user_debt_ceiling
      // for verifying oracle reporter
      oracleReporter.wallet.publicKey, // oracle_reporter
      {
        accounts: {
          authority: user.wallet.publicKey,
          globalState: accounts.global.pubKey,
          mintUsdx: accounts.usdx.pubKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }
    )
  );

  // send transaction
  const receipt = await handleTxn(txn, user.provider.connection, user.wallet);
  return receipt;
};

/**
 * Creates global state account and usdx mint account
 * auth needs to be 7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi, this will fail otherwise
 */
export const createGlobalStatePASS = async (
  superUser: User,
  accounts: Accounts
) => {
  assert(
    superUser.wallet.publicKey.toString() ===
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this PASS test, please use super user account"
  );
  // create the global state account and mint account
  // check if global state exists. If not, create it
  // we are not throwing an error or asserting account-not-created here
  //    because we may be running this multiple times on a live localnet
  //    or devnet, or even mainnet.
  //    So, we will just pass on recreating global state if it exists
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  if (!globalStateAccttInfo)
    await accounts.global.initGlobalState(superUser);
    // await createGlobalStateCall(accounts, superUser, oracleReporter);
  else console.log("GLOBAL STATE ALREADY CREATED", globalStateAccttInfo);

  // check if global state exists
  const globalState: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();
  // testing if each of the global state's parameters exists
  assert(
    globalState.authority.toBase58() === superUser.wallet.publicKey.toBase58(),
    "\n global state auth is not super user"
  );
  assert(
    globalState.mintUsdx.toBase58() === accounts.usdx.pubKey.toBase58(),
    "\n USDx mint is not correct"
  );
  assert(
    globalState.tvlCollatCeilingUsd.toNumber() ===
      addZeros(TVL_LIMIT_USD, DECIMALS_USD),
    `Global-state TVL Limit: ${globalState.tvlCollatCeilingUsd} \nTVL Limit: ${TVL_LIMIT_USD}`
  );
  assert(globalState.tvlUsd.toNumber() === 0, "Err: Global-state.tvl != 0");
  assert(
    globalState.totalDebtUsdx.toNumber() === 0,
    "Err: Global-state-total-debt != 0"
  );
  assert(
    globalState.debtCeilingGlobal.toNumber() ===
      addZeros(DEBT_CEILING_GLOBAL_USDX, DECIMALS_USDX),
    `GlobalState Global Debt Ceiling: ${
      globalState.debtCeilingGlobal
    } Global Debt Ceiling: ${addZeros(DEBT_CEILING_GLOBAL_USDX, DECIMALS_USDX)}`
  );
  assert(
    globalState.debtCeilingUser.toNumber() ===
      addZeros(DEBT_CEILING_USER_USDX, DECIMALS_USDX),
    `GlobalState User Debt Ceiling: ${
      globalState.debtCeilingUser
    } User Debt Ceiling: ${addZeros(DEBT_CEILING_USER_USDX, DECIMALS_USDX)}`
  );
};

/**
 * In this FAIL test - auth is not 7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi
 * Verify that the user being passed into the fxn is not super
 */
export const createGlobalStateFAIL_auth = async (
  notSuperUser: User,
  oracleReporter: User,
  accounts: Accounts
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
    createGlobalStateCall(accounts, notSuperUser, oracleReporter)
  ).to.be.rejectedWith("2003");
};

/**
 * In this FAIL test - we try to create a new global state when it already exists
 */
export const createGlobalStateFAIL_duplicate = async (
  oracleReporter: User,
  superUser: User,
  accounts: Accounts
) => {
  // check if global state exists. It should exist for this test
  accounts.global.getAccountInfo();
  const globalStateAccountInfo: web3.AccountInfo<Buffer> =
    await superUser.provider.connection.getAccountInfo(accounts.global.pubKey);

  assert(
    globalStateAccountInfo,
    "Please place test after global state account creation"
  );

  // { code: 0, byte: 0x0, name: "AlreadyInUse", msg: "Already in use" },
  await expect(
    createGlobalStateCall(accounts, superUser, oracleReporter)
  ).to.be.rejectedWith("0", "AlreadyInUse: Already in use");
  console.log("^ this is failing correctly, as expected");
};
