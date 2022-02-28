// anchor imports
import {
  getProvider,
  Program,
  web3,
  workspace,
  IdlAccounts,
  BN,
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
import { MintPubKey, Trove, Vault } from "../utils/interfaces";
// program
const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 *
 * @param userConnection
 * @param userWallet
 * @param trove
 * @param vault
 * @param mintPubKey
 * @returns
 */
const createTroveCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  trove: Trove,
  vault: Vault,
  mintPubKey: MintPubKey
) => {
  const txn = new web3.Transaction().add(
    programStablePool.instruction.createTrove(
      // trove_bump
      trove.bump,
      // ata_trove_bump
      trove.ata.bump,
      // ceiling
      new BN(0),
      {
        accounts: {
          // account that owns the trove
          authority: userWallet.publicKey,
          // state account where all the platform funds go thru or maybe are stored
          vault: vault.pubKey,
          // the user's trove is the authority for the collateral tokens within it
          trove: trove.pubKey,
          // this is the trove's ATA for the collateral's mint, previously named tokenColl
          ataTrove: trove.ata.pubKey,
          // the mint address for the specific collateral provided to this trove
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

export const createTrovePASS = async (
  userWallet: Wallet,
  userConnection: Connection,
  trove: Trove,
  vault: Vault,
  mintPubKey: MintPubKey
) => {
  // derive trove account
  console.log("getting trove acct");

  // get user trove info
  const troveInfo: web3.AccountInfo<Buffer> = await trove.getAccountInfo();

  // if not created, create user trove
  if (!troveInfo) {
    const confirmation = await createTroveCall(
      userConnection,
      userWallet,
      trove,
      vault,
      mintPubKey
    );
    console.log("created trove: ", confirmation);
  } else console.log("User trove already created");

  // get the user trove state
  const troveLpSaberAcct: IdlAccounts<StablePool>["trove"] =
    await trove.getAccount();
  console.log("troveLpSaberAcct", troveLpSaberAcct);
  // final asserts
  assert(troveLpSaberAcct.debt.toNumber() == 0, "debt mismatch");
};

// /**
//  * Fail when attempting to make a trove that already exists
//  * @param provider
//  * @param accounts
//  * @param user
//  */
// export const createTroveFAIL_Duplicate = async (
//   provider: Provider,
//   accounts: Accounts,
//   user: User
// ) => {
//   // get user trove info
//   const troveInfo: web3.AccountInfo<Buffer> =
//     await getProvider().connection.getAccountInfo(user.troveLpSaber.pubKey);

//   // trove must exist for this test to be run
//   assert(troveInfo, "User trove doesnt exist, test needs a trove");
//   await expect(
//     createTroveCall(
//       provider,
//       user,
//       user.troveLpSaber,
//       accounts.vaultLpSaber,
//       accounts.mintLpSaber
//     ),
//     "No error was thrown when trying to create a duplicate user trove"
//   ).is.rejected;
//   console.log("user trove confirmed not created");
// };
