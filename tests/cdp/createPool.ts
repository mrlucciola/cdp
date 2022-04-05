import {
  Program,
  web3,
  workspace,
  BN,
  IdlAccounts,
} from "@project-serum/anchor";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// solana imports
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import {
  DEBT_CEILING_POOL_USDX,
  DECIMALS_USDC,
  DECIMALS_USDX,
  DECIMALS_USDT,
  PLATFORM_TYPE_SABER,
} from "../utils/constants";
import { handleTxn } from "../utils/fxns";
import { Accounts } from "../config/accounts";
import { User, Pool } from "../utils/interfaces";

// program
const programStablePool = workspace.StablePool as Program<StablePool>;

const createPoolCall = async (
  user: User,
  accounts: Accounts,
  riskLevel: number,
  isDual: number,
  pool: Pool,
  tokenADecimals: number,
  tokenBDecimals: number
) => {
  const txnCreateUserPool = new web3.Transaction().add(
    programStablePool.instruction.createPool(
      pool.bump,
      new BN(riskLevel),
      new BN(isDual),
      new BN(DEBT_CEILING_POOL_USDX * 10 ** DECIMALS_USDX),
      PLATFORM_TYPE_SABER,
      accounts.usdc.mint,
      accounts.usdt.mint,
      [accounts.sbr.mint],
      tokenADecimals,
      tokenBDecimals,
      {
        accounts: {
          authority: user.wallet.publicKey,
          pool: pool.pubKey,
          globalState: accounts.global.pubKey,
          mintCollat: accounts.lpSaberUsdcUsdt.mint,

          // system accts
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }
    )
  );

  // send transaction
  const receipt = await handleTxn(
    txnCreateUserPool,
    user.provider.connection,
    user.wallet
  );
  console.log("created pool", receipt);
  return receipt;
};

export const createPoolFAIL_auth = async (
  notSuperUser: User,
  accounts: Accounts,
  pool: Pool
) => {
  assert(
    notSuperUser.wallet.publicKey.toString() !==
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this fail test, do not use super user account"
  );
  // get token pool info
  const poolAcctInfo: web3.AccountInfo<Buffer> =
    await notSuperUser.provider.connection.getAccountInfo(pool.pubKey);

  // if created, we cannot run this test
  if (poolAcctInfo) console.log("\n\n Pool already created, skipping test \n");
  else {
    // params
    const riskLevel = 0;
    const isDual = 0;

    // asserts
    // this does not identify the correct error code properly
    await expect(
      createPoolCall(
        notSuperUser,
        accounts,
        riskLevel,
        isDual,
        pool,
        DECIMALS_USDC,
        DECIMALS_USDT
      )
    ).to.be.rejectedWith(
      "2003",
      "No error was thrown when trying to create a pool with a user different than the super owner"
    );
  }
};

/**
 * Attempt to create a pool with no global state
 *
 * should fail
 * @param superUser
 * @param accounts
 * @param pool
 */
export const createPoolFAIL_noGlobalState = async (
  superUser: User,
  accounts: Accounts,
  pool: Pool
) => {
  /**
   * we are not throwing an error or asserting pool-not-created here
   *   because we may be running this multiple times on a live localnet
   *   or devnet, or even mainnet.
   *   So, we will just pass on recreating pool if it exists
   */
  const globalStateInfo = await accounts.global.getAccountInfo();

  if (!globalStateInfo) {
    // params
    const riskLevel = 0;
    const isDual = 0;
    await expect(
      createPoolCall(
        superUser,
        accounts,
        riskLevel,
        isDual,
        pool,
        DECIMALS_USDC,
        DECIMALS_USDT
      ),
      "The program expected this account to be already initialized"
    ).to.be.rejectedWith(
      "3012",
      "No error was thrown when trying to create a pool without a global state created. Please check anchor version."
    );
  } else {
    console.log("\n\n SKIPPING TEST: GLOBAL STATE EXISTS");
  }
};

/**
 * Attempt to create a pool with an identical pool already created
 *
 * should fail
 * @param superUser
 * @param accounts
 * @param pool
 */
export const createPoolFAIL_dup = async (
  superUser: User,
  accounts: Accounts,
  pool: Pool
) => {
  const globalStateInfo = await accounts.global.getAccountInfo();
  assert(
    globalStateInfo,
    "Global state account does not exist. Please place this test after the PASS test."
  );
  const poolInfo: web3.AccountInfo<Buffer> = await pool.getAccountInfo();
  assert(
    poolInfo,
    "Pool account does not exist. Please place this test after the PASS test."
  );
  assert(
    superUser.wallet.publicKey.toString() ===
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "Please use super user account"
  );

  // params
  const riskLevel = 0;
  const isDual = 0;
  await expect(
    createPoolCall(
      superUser,
      accounts,
      riskLevel,
      isDual,
      pool,
      DECIMALS_USDC,
      DECIMALS_USDT
    ),
    "Already in use"
  ).to.be.rejectedWith(
    "0",
    "No error was thrown when trying to create a duplicate pool."
  );
};

export const createPoolPASS = async (
  superUser: User,
  accounts: Accounts,
  pool: Pool
) => {
  assert(
    superUser.wallet.publicKey.toString() ===
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this PASS test, please use super user account"
  );
  /**
   * get token pool info to check if it exists. If not, create it.
   *
   * we are not throwing an error or asserting pool-not-created here
   *   because we may be running this multiple times on a live localnet
   *   or devnet, or even mainnet.
   *   So, we will just pass on recreating pool if it exists
   */
  const poolAcctInfo: web3.AccountInfo<Buffer> = await pool.getAccountInfo();

  // if not created, create token pool
  if (!poolAcctInfo) {
    const riskLevel = 0;
    const isDual = 0;
    const confirmation = await createPoolCall(
      superUser,
      accounts,
      riskLevel,
      isDual,
      pool,
      DECIMALS_USDC,
      DECIMALS_USDT
    );
    console.log("token pool created- confirmation: ", confirmation);
  } else console.log("token pool already created:");

  const poolAcct: IdlAccounts<StablePool>["pool"] =
    await accounts.lpSaberUsdcUsdt.pool.getAccount();
  console.log("pool account:", poolAcct);
};
