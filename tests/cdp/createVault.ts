import * as anchor from "@project-serum/anchor";
import {
  Provider,
  getProvider,
  Program,
  web3,
  // @ts-ignore
  workspace,
  // likely that saber library is interfering with anchor's wallet
  Wallet,
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
import * as constants from "../utils/constants";
import { handleTxn } from "../utils/fxns";
import { Accounts, Vault } from "../config/accounts";

// program
const programStablePool = workspace.StablePool as Program<StablePool>;

const createVaultCall = async (
  provider: Provider,
  // @ts-ignore likely that saber library is interfering with anchor's wallet
  wallet: Wallet,
  accounts: Accounts,
  riskLevel: number,
  isDual: number,
  vault: Vault // prev: tokenVault
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
          authority: wallet.publicKey,
          vault: vault.pubKey,
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
export const createVaultFAILSuper = async (
  provider: Provider,
  accounts: Accounts,
  // @ts-ignore likely that saber library is interfering with anchor's wallet
  baseUserWallet: Wallet,
  vault: Vault // prev: tokenVault
) => {
  // get token vault info
  const vaultInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(vault.pubKey);

  // if created, we cannot run this test
  if (vaultInfo)
    console.log("\n\n Token vault already created, cannot run test \n");
  else {
    // params
    const riskLevel = 0;
    const isDual = 0;

    // asserts
    await assert.isRejected(
      createVaultCall(
        provider,
        baseUserWallet,
        accounts,
        riskLevel,
        isDual,
        vault
      ),
      /Signature verification failed/,
      // /A raw constraint was violated/, // this is failing for me (jkap)
      "No error was thrown when trying to create a vault with a user different than the super owner"
    );
    await assert.isRejected(
      programStablePool.account.vault.fetch(vault.pubKey),
      /Account does not exist/,
      "Fetching a vault that shouldn't had been created did not throw an error"
    );
  }
};

export const createVaultFAILGlobalState = async (
  provider: Provider,
  accounts: Accounts,
  // @ts-ignore   likely that saber library is interfering with anchor's wallet
  superWallet: Wallet,
  vault: Vault // prev: tokenVault
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
    createVaultCall(provider, superWallet, accounts, riskLevel, isDual, vault),
    "No error was thrown when trying to create a vault without a global state created"
  ).is.rejected;

  console.log("Confirming vault was not created");
  await assert.isRejected(
    programStablePool.account.vault.fetch(vault.pubKey),
    /Account does not exist/,
    "Fetching a vault that shouldn't had been created did not throw an error"
  );
};
export const createVaultPASS = async (
  provider: Provider,
  accounts: Accounts,
  // @ts-ignore TODO: FIX
  wallet: Wallet,
  vault: Vault // prev: tokenVault
) => {
  // get token vault info
  const vaultInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(vault.pubKey);

  // if not created, create token vault
  if (!vaultInfo) {
    // params
    const riskLevel = 0;
    const isDual = 0;
    const confirmation = await createVaultCall(
      provider,
      wallet,
      accounts,
      riskLevel,
      isDual,
      vault
    );
    console.log("token vault created- confirmation: ", confirmation);
  } else console.log("token vault already created:", vaultInfo);
  // get the token vault state
  const vaultState: IdlAccounts<StablePool>["vault"] =
    await programStablePool.account.vault.fetch(vault.pubKey);
  // assign to the test state var
  vault.state = vaultState;
  console.log("\n\n token vault account: ", vault.state);
};
