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
import * as constants from "../utils/constants";
import { Accounts } from "../config/accounts";
import { StablePool } from "../../target/types/stable_pool";
import { User } from "../utils/interfaces";

const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * Calls setHarvestFee
 * @param accounts
 * @param user
 * @param feeNum - new fee Numerator value
 * @returns transaction receipt
 */
const setHarvestFeeCall = async (
  accounts: Accounts,
  user: User,
  feeNum: number
) => {
  const txnSetHarvestFee = new web3.Transaction().add(
    programStablePool.instruction.setHarvestFee(new BN(feeNum), {
      accounts: {
        authority: user.wallet.publicKey,
        globalState: accounts.global.pubKey,
      },
      signers: [user.wallet.payer],
    })
  );
  // send transaction
  const receipt = await handleTxn(
    txnSetHarvestFee,
    user.provider.connection,
    user.wallet
  );
  return receipt;
};

/**
 * Verify that harvest fee cannot be set by a non-super user
 * @param notSuperUser
 * @param accounts
 */
export const setHarvestFeeFAIL_auth = async (
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

  const newHarvestFee = 100;

  await expect(
    setHarvestFeeCall(accounts, notSuperUser, newHarvestFee)
  ).to.be.rejectedWith(
    "2001",
    "No error was thrown when trying to set harvest fee with a user different than the super owner"
  );

  const globalState: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();
  assert(
    globalState.feeNum.toNumber() != newHarvestFee,
    "Harvest Fee updated even though transaction was rejected."
  );
};

/**
 * Verify super user can set harvest fee
 * @param superUser
 * @param accounts
 */
export const setHarvestFeePASS = async (
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

  const newHarvestFee = 100;

  let confirmation = await setHarvestFeeCall(
    accounts,
    superUser,
    newHarvestFee
  );
  assert(confirmation, "Failed to set Harvest Fee");

  let globalState: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();

  assert(
    globalState.feeNum.toNumber() == newHarvestFee,
    "Harvest Fee was not updated even though transaction succeeded."
  );

  confirmation = await setHarvestFeeCall(
    accounts,
    superUser,
    constants.DEFAULT_FEE_NUMERATOR
  );
  assert(confirmation, "Failed to set Harvest Fee back to original value");

  globalState = await accounts.global.getAccount();
  assert(
    globalState.feeNum.toNumber() == constants.DEFAULT_FEE_NUMERATOR,
    "Harvest Fee was not updated even though transaction succeeded."
  );
};
