// anchor imports
import { Program, web3, workspace, Wallet } from "@project-serum/anchor";
import {
  Connection,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
// solana imports
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
// utils
import { assert } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import { handleTxn } from "../utils/fxns";
import { MintPubKey, Trove, Pool } from "../utils/interfaces";
// program
const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * The rpc call that creates a rewards vault
 * A reward vault has ...
 * It does ...
 */
const createRewardVaultCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  trove: Trove,
  pool: Pool,
  rewardMint: MintPubKey
) => {
  console.log([rewardMint] + "");
  const txn = new web3.Transaction().add(
    programStablePool.instruction.createRewardVault({
      accounts: {
        authority: userWallet.publicKey,
        pool: pool.pubKey,
        trove: trove.pubKey,

        rewardVault: trove.ataRewards[0].pubKey,
        rewardMint,

        // system accts
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    })
  );

  // send transaction
  const receipt = await handleTxn(txn, userConnection, userWallet);

  return receipt;
};

/**
 * Pass when attempting to make a trove that doesn't exist
 */
export const createTroveRewardVault = async (
  userWallet: Wallet,
  userConnection: Connection,
  trove: Trove,
  pool: Pool,
  mintPubKey: MintPubKey
) => {
  const confirmation = await createRewardVaultCall(
    userConnection,
    userWallet,
    trove,
    pool, // could be a reward vau lt
    mintPubKey
  );
  console.log("created reward vault: ", confirmation);

  const troveReward = await trove.ataRewards[0].getBalance();
  assert(
    troveReward.value.amount == "0",
    "trove ata of reward balance mismatch"
  );
};
