// anchor imports
import {
    Program,
    web3,
    workspace,
    BN,
    IdlAccounts,
    IdlError,
    ProgramError,
    eventDiscriminator
  } from "@project-serum/anchor";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// solana imports
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { handleTxn } from "../utils/fxns";
import * as constants from "../utils/constants";
import { Accounts } from "../config/accounts";
import { StablePool } from "../../target/types/stable_pool";
import { User } from "../utils/interfaces";
import { program } from "@project-serum/anchor/dist/cjs/spl/token";

const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * Calls setGlobalTvlLimit
 * @param accounts 
 * @param user 
 * @param limit - new TVL limit
 * @returns transaction receipt
 */
const setGlobalTvlLimitCall = async (
	accounts: Accounts, 
	user: User, 
	limit: number
) => {
	const txnSetGlobalTvlLimit = new web3.Transaction().add(
    programStablePool.instruction.setGlobalTvlLimit(
			new BN(limit),
			{
				accounts: {
					authority: user.wallet.publicKey,
					globalState: accounts.global.pubKey,
				},
				signers: [user.wallet.payer],
			}
		)
	)
	// send transaction
	const receipt = await handleTxn(
    txnSetGlobalTvlLimit, 
    user.provider.connection, 
    user.wallet);
	return receipt;
};

/**
 * Verify that global tvl limit cannot be set by a non-super user
 * @param notSuperUser 
 * @param accounts 
 */
export const setGlobalTvlLimitFAIL_auth = async (
  notSuperUser: User,
  accounts: Accounts,
) => {
  assert(
    notSuperUser.wallet.publicKey.toString() !==
    "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this fail test, do not use super user account"
  );

  let globalStateAccttInfo: web3.AccountInfo<Buffer> =
  await accounts.global.getAccountInfo();
  assert(globalStateAccttInfo, "Global State must be created to run admin panel tests");

  const newTvlLimit = 2_000_000_000;

  await expect(
    setGlobalTvlLimitCall(accounts, notSuperUser, newTvlLimit)
  ).to.be.rejectedWith(
    "2003",
    "No error was thrown when trying to set tvl limit with a user different than the super owner"
  );

  const globalState: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();
  assert(globalState.tvlLimit.toNumber() != newTvlLimit, 
  "TVL Limit updated even though transaction was rejected.");
};

/**
 * Verify super user can set global TVL limit
 * @param superUser 
 * @param accounts 
 */
export const setGlobalTvlLimitPASS = async (
  superUser: User,
  accounts: Accounts,
) => {
  assert(
    superUser.wallet.publicKey.toString() ==
    "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this pass test, you must use super user account"
  );

  let globalStateAccttInfo: web3.AccountInfo<Buffer> =
  await accounts.global.getAccountInfo();
  assert(globalStateAccttInfo, "Global State must be created to run admin panel tests");

  const newTvlLimit = 2_000_000_000;

  let confirmation = await setGlobalTvlLimitCall(accounts, superUser, newTvlLimit);
  assert(confirmation, "Failed to set TVL Limit");

  let globalState: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();

  assert(globalState.tvlLimit.toNumber() == newTvlLimit, 
  "TVL Limit was not updated even though transaction succeeded.");

  confirmation = await setGlobalTvlLimitCall(accounts, superUser, constants.TVL_LIMIT);
  assert(confirmation, "Failed to set TVL Limit back to original value");

  globalState = await accounts.global.getAccount();
  assert(globalState.tvlLimit.toNumber() == constants.TVL_LIMIT, 
  "TVL Limit was not updated even though transaction succeeded.");
};
