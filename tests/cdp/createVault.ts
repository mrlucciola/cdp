// anchor imports
import {
  getProvider,
  Program,
  web3,
  workspace,
  IdlAccounts,
  Wallet,
} from "@project-serum/anchor";
import { Connection, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// solana imports
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import { handleTxn } from "../utils/fxns";
import { MintPubKey, Vault, Pool } from "../utils/interfaces";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

const createVaultCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  vault: Vault,
  pool: Pool,
  mintPubKey: MintPubKey
) => {
  const txn = new web3.Transaction().add(
    programStablePool.instruction.createVault(
      // vault_bump
      vault.bump,
      // ata_vault_bump
      vault.ata.bump,
      {
        accounts: {
          // account that owns the vault
          authority: userWallet.publicKey,
          // state account where all the platform funds go thru or maybe are stored
          pool: pool.pubKey,
          // the user's vault is the authority for the collateral tokens within it
          vault: vault.pubKey,
          // this is the vault's ATA for the collateral's mint, previously named tokenColl
          ataVault: vault.ata.pubKey,
          // the mint address for the specific collateral provided to this vault
          mint: mintPubKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
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
 * Pass when attempting to make a vault that doesn't exist
 */
export const createVaultPASS = async (
  userWallet: Wallet,
  userConnection: Connection,
  vault: Vault,
  pool: Pool,
  mintPubKey: MintPubKey
) => {
  // derive vault account
  console.log("getting vault acct");

  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> = await vault.getAccountInfo();

  // if not created, create user vault
  if (!vaultInfo) {
    const confirmation = await createVaultCall(
      userConnection,
      userWallet,
      vault,
      pool,
      mintPubKey
    );
    console.log("created vault: ", confirmation);
  } else console.log("User vault already created");

  // get the user vault state
  const vaultLpSaberAcct: IdlAccounts<StablePool>["vault"] =
    await vault.getAccount();
  console.log("vaultLpSaberAcct.debt:", vaultLpSaberAcct.debt);
  // final asserts
  assert(vaultLpSaberAcct.debt.toNumber() == 0, "debt mismatch");
};

/**
 * Fail when attempting to make a vault that already exists
 */
export const createVaultFAIL_Duplicate = async (
  userWallet: Wallet,
  userConnection: Connection,
  vault: Vault,
  pool: Pool,
  mintPubKey: MintPubKey
) => {
  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(vault.pubKey);

  // if vault created, try to create another one for the same user (should fail)
  assert(vaultInfo, "User vault does not exist, test needs a vault");
  await expect(
    createVaultCall(userConnection, userWallet, vault, pool, mintPubKey),
    "No error was thrown was trying to create a duplicate user vault"
  ).is.rejected;

  // get the user vault state
  const vaultLpSaberAcct: IdlAccounts<StablePool>["vault"] =
    await vault.getAccount();
  console.log("vaultLpSaberAcct debt: ", vaultLpSaberAcct.debt);
  // final asserts
  assert(vaultLpSaberAcct.debt.toNumber() == 0, "debt mismatch");
};
