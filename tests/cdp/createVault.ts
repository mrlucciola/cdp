import {
  Program,
  web3,
  workspace,
  BN,
  ProgramError,
} from "@project-serum/anchor";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// solana imports
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import * as constants from "../utils/constants";
import { handleTxn } from "../utils/fxns";
import { Accounts } from "../config/accounts";
import { User, Vault } from "../utils/interfaces";
import { errors } from "../utils/errors";

// program
const programStablePool = workspace.StablePool as Program<StablePool>;

const createVaultCall = async (
  user: User,
  accounts: Accounts,
  riskLevel: number,
  isDual: number,
  vault: Vault
) => {
  const txnCreateUserVault = new web3.Transaction().add(
    programStablePool.instruction.createVault(
      vault.bump,
      new BN(riskLevel),
      new BN(isDual),
      new BN(constants.VAULT_DEBT_CEILING),
      constants.PLATFORM_TYPE_SABER,
      {
        accounts: {
          authority: user.wallet.publicKey,
          vault: vault.pubKey,
          globalState: accounts.global.pubKey,
          mintColl: accounts.lpSaberUsdcUsdt.mint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [user.wallet.payer],
      }
    )
  );
  try {
    const receipt = await handleTxn(txnCreateUserVault, user);
    console.log("created user vault", receipt);
    return receipt;
  } catch (error) {
    const idlErrors = new Map(
      errors.map((e) => [e.code, `${e.name}: ${e.msg}`])
    );
    const translatedErr = ProgramError.parse(error, idlErrors);
    throw translatedErr;
  }
};

// TODO: FIX THIS TEST SO WE CAN GET PROPER CONSTRAINT MESSAGE
export const createVaultFAIL_auth = async (
  notSuperUser: User,
  accounts: Accounts,
  vault: Vault
) => {
  assert(
    notSuperUser.wallet.publicKey.toString() !==
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this fail test, do not use super user account"
  );
  // get token vault info
  const vaultAcctInfo: web3.AccountInfo<Buffer> =
    await notSuperUser.provider.connection.getAccountInfo(vault.pubKey);

  // if created, we cannot run this test
  if (vaultAcctInfo)
    console.log("\n\n Vault already created, cannot run test \n");
  else {
    // params
    const riskLevel = 0;
    const isDual = 0;

    // asserts
    // this does not identify the correct error code properly
    await expect(
      createVaultCall(notSuperUser, accounts, riskLevel, isDual, vault),
    ).to.be.rejectedWith("2003", "No error was thrown when trying to create a vault with a user different than the super owner");
    // this does not identify the correct error code properly
    await assert.isRejected(
      programStablePool.account.vault.fetch(vault.pubKey),
      /Account does not exist/,
      "Fetching a vault that shouldn't had been created did not throw an error"
    );
  }
};

/**
 * Attempt to create a vault with no global state
 *
 * should fail
 * @param superUser
 * @param accounts
 * @param vault
 */
export const createVaultFAIL_noGlobalState = async (
  superUser: User,
  accounts: Accounts,
  vault: Vault
) => {
  /**
   * we are not throwing an error or asserting vault-not-created here
   *   because we may be running this multiple times on a live localnet
   *   or devnet, or even mainnet.
   *   So, we will just pass on recreating vault if it exists
   */
  const globalStateInfo = await accounts.global.getAccount();

  if (!globalStateInfo) {
    // params
    const riskLevel = 0;
    const isDual = 0;
    await expect(
      createVaultCall(superUser, accounts, riskLevel, isDual, vault),
      "The program expected this account to be already initialized"
    ).to.be.rejectedWith(
      "3012",
      "No error was thrown when trying to create a vault without a global state created. Please check anchor version."
    );
  } else {
    console.log('\n\n SKIPPING TEST: GLOBAL STATE EXISTS')
  }
};

/**
 * Attempt to create a vault with an identical vault already created
 *
 * should fail
 * @param superUser
 * @param accounts
 * @param vault
 */
export const createVaultFAIL_dup = async (
  superUser: User,
  accounts: Accounts,
  vault: Vault
) => {
  const globalStateInfo = await accounts.global.getAccount();
  assert(
    globalStateInfo,
    "Global state account does not exist. Please place this test after the PASS test."
  );
  const vaultInfo = await vault.getAccount();
  assert(
    vaultInfo,
    "Vault account does not exist. Please place this test after the PASS test."
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
    createVaultCall(superUser, accounts, riskLevel, isDual, vault),
    "Already in use"
  ).to.be.rejectedWith(
    "0",
    "No error was thrown when trying to create a duplicate vault."
  );
};

export const createVaultPASS = async (
  superUser: User,
  accounts: Accounts,
  vault: Vault
) => {
  assert(
    superUser.wallet.publicKey.toString() ===
      "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi",
    "For this PASS test, please use super user account"
  );
  /**
   * get token vault info to check if it exists. If not, create it.
   *
   * we are not throwing an error or asserting vault-not-created here
   *   because we may be running this multiple times on a live localnet
   *   or devnet, or even mainnet.
   *   So, we will just pass on recreating vault if it exists
   */
  const vaultAcctInfo: web3.AccountInfo<Buffer> = await vault.getAccount();
  // if not created, create token vault
  if (!vaultAcctInfo) {
    const riskLevel = 0;
    const isDual = 0;
    const confirmation = await createVaultCall(
      superUser,
      accounts,
      riskLevel,
      isDual,
      vault
    );
    console.log("token vault created- confirmation: ", confirmation);
  } else console.log("token vault already created:", vaultAcctInfo);
};
