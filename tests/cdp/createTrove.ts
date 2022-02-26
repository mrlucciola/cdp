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
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
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
import { Accounts } from "../config/accounts";
import {
  ATA,
  ITokenAccount,
  MintAcct,
  PDA,
  User,
  UserToken,
} from "../utils/interfaces";
// program
const programStablePool = workspace.StablePool as Program<StablePool>;

interface Trove {
  pubKey: PublicKey; // prev: userTroveKey -> trovePubKey
  bump: number; // prev: userTroveNonce
}
interface Vault {
  pubKey: PublicKey;
  bump: number;
}

const createTroveCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  ata: ATA,
  trove: Trove,
  vault: Vault,
  mint: PublicKey
) => {
  const txn = new web3.Transaction().add(
    programStablePool.instruction.createTrove(
      // prev: user_trove_nonce -> trove_bump
      trove.bump, // prev: userTokenCollNonce
      // token_coll_bump
      ata.bump, // prev: tokenCollNonce
      // ceiling
      new BN(0),
      {
        accounts: {
          // user that owns the trove
          authority: userWallet.publicKey, // prev: troveOwner
          // state account where all the platform funds go thru or maybe are stored
          vault: vault.pubKey,
          // the user's trove is the authority for the collateral tokens within it
          trove: trove.pubKey, // prev: baseUser.trove.pubKey, userTrovePubKey
          // this is the trove's ATA for the collateral's mint, previously named tokenColl
          ataTrove: ata.pubKey, // prev: userTroveTokenVaultKey
          // the mint address for the specific collateral provided to this trove
          mintColl: mint,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }
    )
  );

  // send transaction
  const receipt = await handleTxn(txn, userConnection, userWallet);
  return receipt;
};

export const createTrovePASS = async (
  baseUser: User,
  accounts: Accounts,
  mint: ITokenAccount
) => {
  // get user trove info
  const troveInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(
      baseUser.tokens.lpSaber.trove.pubKey
    );

  // if not created, create user trove
  if (!troveInfo) {
    const confirmation = await createTroveCall(
      baseUser.provider.connection,
      baseUser.wallet,
      baseUser.tokens.lpSaber.ata,
      baseUser.tokens.lpSaber.trove,
      accounts.lpSaberUsdcUsdt.vault,
      mint.mint
    );
    console.log("created user trove: ", confirmation);
  } else console.log("User trove already created");

  // get the user trove state
  let troveLpSaberInfo: IdlAccounts<StablePool>["trove"] =
    await programStablePool.account.trove.fetch(
      baseUser.tokens.lpSaber.trove.pubKey
    );
  // final asserts
  assert(troveLpSaberInfo.debt.toNumber() == 0, "debt mismatch");
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
