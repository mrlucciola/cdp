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
import { Account, Connection, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
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
import { Accounts } from "../config/accounts";
// program
const programStablePool = workspace.StablePool as Program<StablePool>;
const defaultAccounts = {
  tokenProgram: TOKEN_PROGRAM_ID,
  clock: SYSVAR_CLOCK_PUBKEY,
  systemProgram: SystemProgram.programId,
  rent: SYSVAR_RENT_PUBKEY,
  associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
};
/**
 *
 * @param userConnection
 * @param userWallet
 * @param trove
 * @param vault
 * @param rewardMint
 * @returns
 */
const createRewardVaultCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  trove: Trove,
  vault: Vault,
  rewardMint: MintPubKey
) => {
  console.log([rewardMint] + '')
  const txn = new web3.Transaction().add(
    programStablePool.instruction.createRewardVault(
      {
        accounts: {
          authority: userWallet.publicKey,
          vault: vault.pubKey,
          trove: trove.pubKey,

          rewardVault: trove.ataRewards[0].pubKey,
          rewardMint,

          ...defaultAccounts,
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
 * @param userWallet
 * @param userConnection
 * @param trove
 * @param vault
 * @param mintPubkey
 */
export const createTroveRewardVault = async (
  userWallet: Wallet,
  userConnection: Connection,
  trove: Trove,
  vault: Vault,
  mintPubKey: MintPubKey
) => {

  const confirmation = await createRewardVaultCall(
    userConnection,
    userWallet,
    trove,
    vault,
    mintPubKey
  );
  console.log("created reward vault: ", confirmation);

  const troveReward = await trove.ataRewards[0].getBalance();
  assert(troveReward.value.amount == '0', "trove ata of reward balance mismatch");

};
