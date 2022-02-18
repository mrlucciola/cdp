// anchor imports
import {
  Provider,
  getProvider,
  Program,
  web3,
  // @ts-ignore
  workspace,
  Wallet,
  IdlAccounts,
  BN,
} from "@project-serum/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// solana imports
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import { handleTxn } from "../utils/fxns";
import { Accounts } from "../config/accounts";
import { User } from "../config/users";
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
  provider: Provider,
  user: User,
  trove: Trove,
  vault: Vault,
  mint: Token
) => {
  const txnCreateTrove = new web3.Transaction().add(
    programStablePool.instruction.createTrove(
      // prev: user_trove_nonce -> trove_nonce
      trove.bump, // prev: userTokenCollNonce
      // token_coll_nonce
      user.ataLpSaber.bump, // prev: tokenCollNonce
      // ceiling
      new BN(0),
      {
        accounts: {
          // user that owns the trove
          authority: user.wallet.publicKey, // prev: troveOwner
          // state account where all the platform funds go thru or maybe are stored
          vault: vault.pubKey,
          // the user's trove is the authority for the collateral tokens within it
          trove: trove.pubKey, // prev: baseUser.trove.pubKey, userTrovePubKey
          // this is the trove's ATA for the collateral's mint, previously named tokenColl
          ataTrove: user.ataTroveLpSaber.pubKey, // prev: userTroveTokenVaultKey
          // the mint address for the specific collateral provided to this trove
          mintColl: mint.publicKey, // prev: lpMint.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [user.wallet.payer],
      }
    )
  );
  const confirmation = await handleTxn(txnCreateTrove, provider, user.wallet);
  return confirmation;
};

export const createTrovePASS = async (
  provider: Provider,
  accounts: Accounts,
  user: User
) => {
  // get user trove info
  const troveInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(user.troveLpSaber.pubKey);

  // if not created, create user trove
  if (!troveInfo) {
    const confirmation = await createTroveCall(
      provider,
      user,
      user.troveLpSaber,
      accounts.vaultLpSaber,
      accounts.mintLpSaber
    );
    console.log("created user trove: ", confirmation);
  } else console.log("User trove already created");

  // get the user trove state
  let troveLpSaberAuthAcct: IdlAccounts<StablePool>["trove"] =
    await programStablePool.account.trove.fetch(user.troveLpSaber.pubKey);
  // assign to test state
  user.troveLpSaber.state = troveLpSaberAuthAcct;
  console.log("\n\n troveLpSaberAuthAcct: ", user.troveLpSaber.state);

  // final asserts
  assert(
    user.troveLpSaber.state.lockedCollBalance.toNumber() == 0,
    "lockedCollBalance mismatch"
  );
  assert(user.troveLpSaber.state.debt.toNumber() == 0, "debt mismatch");
};

/**
 * Fail when attempting to make a trove that already exists
 * @param provider
 * @param accounts
 * @param user
 */
export const createTroveFAIL_Duplicate = async (
  provider: Provider,
  accounts: Accounts,
  user: User
) => {
  // get user trove info
  const troveInfo: web3.AccountInfo<Buffer> =
    await getProvider().connection.getAccountInfo(user.troveLpSaber.pubKey);

  // trove must exist for this test to be run
  assert(troveInfo, "User trove doesnt exist, test needs a trove");
  await expect(
    createTroveCall(
      provider,
      user,
      user.troveLpSaber,
      accounts.vaultLpSaber,
      accounts.mintLpSaber
    ),
    "No error was thrown when trying to create a duplicate user trove"
  ).is.rejected;
  console.log("user trove confirmed not created");
};
