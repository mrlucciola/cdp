// anchor imports
import {
  Program,
  web3,
  workspace,
  BN,
  IdlAccounts,
} from "@project-serum/anchor";
// utils
import { assert, expect } from "chai";
// local
import { handleTxn } from "../utils/fxns";
import { DEBT_CEILING_USER_USDX } from "../utils/constants";
import { Accounts } from "../config/accounts";
import { StablePool } from "../../target/types/stable_pool";
import { User } from "../utils/interfaces";

const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * Calls setUserDebtCeiling
 * @param accounts
 * @param user
 * @param ceiling - new user debt ceiling
 * @returns transaction receipt
 */
const setUserDebtCeilingCall = async (
  accounts: Accounts,
  user: User,
  ceiling: number
) => {
  const txnSetGlobalTvlLimit = new web3.Transaction().add(
    programStablePool.instruction.setUserDebtCeiling(new BN(ceiling), {
      accounts: {
        authority: user.wallet.publicKey,
        globalState: accounts.global.pubKey,
      },
      signers: [user.wallet.payer],
    })
  );
  // send transaction
  const receipt = await handleTxn(
    txnSetGlobalTvlLimit,
    user.provider.connection,
    user.wallet
  );
  return receipt;
};

/**
 * Verify that user debt ceiling cannot be set by a non-super user
 * @param notSuperUser
 * @param accounts
 */
export const setUserDebtCeilingFAIL_auth = async (
  notSuperUser: User,
  accounts: Accounts
) => {
  assert(
    notSuperUser.wallet.publicKey.toString() !==
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this fail test, do not use super user account"
  );

  let globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Global State must be created to run admin panel tests"
  );

  const newUserDebtCeiling = 10_000_000;

  await expect(
    setUserDebtCeilingCall(accounts, notSuperUser, newUserDebtCeiling)
  ).to.be.rejectedWith(
    "2003",
    "No error was thrown when trying to set user debt ceiling with a user different than the super owner"
  );

  const globalState: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();
  assert(
    globalState.userDebtCeiling.toNumber() != newUserDebtCeiling,
    "User Debt Ceiling updated even though transaction was rejected."
  );
};

/**
 * Verify super user can set user debt ceiling
 * @param superUser
 * @param accounts
 */
export const setUserDebtCeilingPASS = async (
  superUser: User,
  accounts: Accounts
) => {
  assert(
    superUser.wallet.publicKey.toString() ==
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this pass test, you must use super user account"
  );

  let globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Global State must be created to run admin panel tests"
  );

  const newUserDebtCeiling = 10_000_000;

  let confirmation = await setUserDebtCeilingCall(
    accounts,
    superUser,
    newUserDebtCeiling
  );
  assert(confirmation, "Failed to set User Debt Ceiling");

  let globalState: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();

  assert(
    globalState.userDebtCeiling.toNumber() == newUserDebtCeiling,
    "User Debt Ceiling was not updated even though transaction succeeded."
  );

  confirmation = await setUserDebtCeilingCall(
    accounts,
    superUser,
    DEBT_CEILING_USER_USDX
  );
  assert(
    confirmation,
    "Failed to set User Debt Ceiling back to original value"
  );

  globalState = await accounts.global.getAccount();
  assert(
    globalState.userDebtCeiling.toNumber() == DEBT_CEILING_USER_USDX,
    "User Debt Ceiling was not updated even though transaction succeeded."
  );
};
