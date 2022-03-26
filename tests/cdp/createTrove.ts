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
import { MintPubKey, Trove, Pool } from "../utils/interfaces";
// program
const programStablePool = workspace.StablePool as Program<StablePool>;

const createTroveCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  trove: Trove,
  pool: Pool,
  mintPubKey: MintPubKey
) => {
  const txn = new web3.Transaction().add(
    programStablePool.instruction.createTrove(
      // trove_bump
      trove.bump,
      // ata_trove_bump
      trove.ata.bump,
      {
        accounts: {
          // account that owns the trove
          authority: userWallet.publicKey,
          // state account where all the platform funds go thru or maybe are stored
          pool: pool.pubKey,
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

/**
 * Pass when attempting to make a trove that doesn't exist
 */
export const createTrovePASS = async (
  userWallet: Wallet,
  userConnection: Connection,
  trove: Trove,
  pool: Pool,
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
      pool,
      mintPubKey
    );
    console.log("created trove: ", confirmation);
  } else console.log("User trove already created");

  // get the user trove state
  const troveLpSaberAcct: IdlAccounts<StablePool>["trove"] =
    await trove.getAccount();
  console.log("troveLpSaberAcct.debt:", troveLpSaberAcct.debt);
  // final asserts
  assert(troveLpSaberAcct.debt.toNumber() == 0, "debt mismatch");
};

/**
 * Fail when attempting to make a trove that already exists
 */
export const createTroveFAIL_Duplicate = async (
  userWallet: Wallet,
  userConnection: Connection,
  trove: Trove,
  pool: Pool,
  mintPubKey: MintPubKey
) => {
  // get user trove info
  const troveInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(trove.pubKey);

  // if trove created, try to create another one for the same user (should fail)
  assert(troveInfo, "User trove does not exist, test needs a trove");
  await expect(
    createTroveCall(userConnection, userWallet, trove, pool, mintPubKey),
    "No error was thrown was trying to create a duplicate user trove"
  ).is.rejected;

  // get the user trove state
  const troveLpSaberAcct: IdlAccounts<StablePool>["trove"] =
    await trove.getAccount();
  console.log("troveLpSaberAcct debt: ", troveLpSaberAcct.debt);
  // final asserts
  assert(troveLpSaberAcct.debt.toNumber() == 0, "debt mismatch");
};
