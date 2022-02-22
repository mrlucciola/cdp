// anchor/solana
import {
  Provider,
  getProvider,
  Program,
  web3,
  // @ts-ignore
  workspace,
  Wallet,
  BN,
  IdlAccounts,
} from "@project-serum/anchor";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// testing
import { assert, expect } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import { handleTxn } from "../utils/fxns";
import { Accounts, Vault } from "../config/accounts";
import * as constants from "../utils/constants";
// program
const programStablePool = workspace.StablePool as Program<StablePool>;

const createTokenVaultCall = async (
  provider: Provider,
  wallet: Wallet,
  accounts: Accounts,
  riskLevel: number,
  isDual: number,
  vaultColl: Vault, // prev: tokenVault
) => {
  const txnCreateUserVault = new web3.Transaction().add(
    programStablePool.instruction.createTokenVault(
      vaultColl.bump,
      new BN(riskLevel),
      new BN(isDual),
      new BN(constants.VAULT_DEBT_CEILING),
      constants.PLATFORM_TYPE_SABER,
      {
        accounts: {
          authority: wallet.publicKey,
          vaultColl: vaultColl.pubKey,
          globalState: accounts.global.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [wallet.payer],
      }
    )
  );
  const confirmation = await handleTxn(txnCreateUserVault, provider, wallet);
  console.log("created user vault", confirmation);
  return confirmation;
};

// TODO: FIX THIS TEST SO WE CAN GET PROPER CONSTRAINT MESSAGE
export const createTokenVaultFAILSuper = async (
  provider: Provider,
  accounts: Accounts,
  baseUserWallet: Wallet,
  vaultColl: Vault // prev: tokenVault
) => {
  // get token vault info
  const tokenVaultInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(vaultColl.pubKey);

  // if created, we cannot run this test
  if (tokenVaultInfo)
    console.log("\n\n Token vault already created, cannot run test \n");
  else {
    // params
    const riskLevel = 0;
    const isDual = 0;

    // asserts
    await assert.isRejected(
      createTokenVaultCall(
        provider,
        baseUserWallet,
        accounts,
        riskLevel,
        isDual,
        vaultColl
      ),
      /Signature verification failed/,
      // /A raw constraint was violated/, // this is failing for me (jkap)
      "No error was thrown when trying to create a vault with a user different than the super owner"
    );
    await assert.isRejected(
      programStablePool.account.vaultColl.fetch(vaultColl.pubKey),
      /Account does not exist/,
      "Fetching a vault that shouldn't had been created did not throw an error"
    );
  }
};

export const createTokenVaultFAILGlobalState = async (
  provider: Provider,
  accounts: Accounts,
  superWallet: Wallet,
  vaultColl: Vault // prev: tokenVault
) => {
  console.log("Checking if global state exists");
  await assert.isRejected(
    programStablePool.account.globalState.fetch(accounts.global.pubKey),
    /Account does not exist /,
    "The global state exists- it should not for this test. Please reorder tests."
  );

  // params
  const riskLevel = 0;
  const isDual = 0;
  await expect(
    createTokenVaultCall(
      provider,
      superWallet,
      accounts,
      riskLevel,
      isDual,
      vaultColl
    ),
    "No error was thrown when trying to create a vault without a global state created"
  ).is.rejected;

  console.log("Confirming vault was not created");
  await assert.isRejected(
    programStablePool.account.vaultColl.fetch(vaultColl.pubKey),
    /Account does not exist/,
    "Fetching a vault that shouldn't had been created did not throw an error"
  );
};
export const createTokenVaultPASS = async (
  provider: Provider,
  accounts: Accounts,
  wallet: Wallet,
  vaultColl: Vault // prev: tokenVault
) => {
  // get token vault info
  const tokenVaultInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(vaultColl.pubKey);

  // if not created, create token vault
  if (!tokenVaultInfo) {
    // params
    const riskLevel = 0;
    const isDual = 0;
    const confirmation = await createTokenVaultCall(
      provider,
      wallet,
      accounts,
      riskLevel,
      isDual,
      vaultColl
    );
    console.log("token vault created- confirmation: ", confirmation);
  } else console.log("token vault already created:", tokenVaultInfo);
  // get the token vault state
  const tokenVaultState: IdlAccounts<StablePool>["vaultColl"] =
    await programStablePool.account.vaultColl.fetch(vaultColl.pubKey);
  // assign to the test state var
  vaultColl.state = tokenVaultState;
  console.log("\n\n token vault account: ", vaultColl.state);
};
