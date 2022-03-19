// anchor imports
import {
  getProvider,
  Program,
  web3,
  workspace,
  IdlAccounts,
  BN,
  Wallet,
  Provider,
} from "@project-serum/anchor";
import { Account, Connection, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// solana imports
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
// utils
import { assert, expect } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import { getAssocTokenAcct, handleTxn } from "../utils/fxns";
import { Miner, MintPubKey, Trove, Vault } from "../utils/interfaces";
import { Accounts } from "../config/accounts";
import { findMinerAddress, QuarrySDK, QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
import { SignerWallet, SolanaProvider } from "@saberhq/solana-contrib";
import { Token as SToken} from "@saberhq/token-utils";
import { USDCUSDT_DECIMAL } from "../utils/constants";
import { assertTXSuccess } from "@saberhq/chai-solana";
  // program
  const programStablePool = workspace.StablePool as Program<StablePool>;
  export const defaultAccounts = {
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
  const createQuarryMinerCall = async (
    userConnection: Connection,
    userWallet: Wallet,
    trove: Trove,
    vault: Vault,
    rewarder: PublicKey,
    quarry: PublicKey,
    miner: Miner,
    tokenMint: MintPubKey
  ) => {
    const txn = new web3.Transaction().add(
      programStablePool.instruction.createSaberUser(
        miner.bump,
        {
          accounts: {
            vault: vault.pubKey,
            trove: trove.pubKey,
            authority: userWallet.publicKey,
            miner: miner.pubkey,
            quarry,
            rewarder,
            minerVault: miner.ata.pubKey,
            mint: tokenMint,
            quarryProgram: QUARRY_ADDRESSES.Mine,
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
  export const createSaberUser = async (
    userWallet: Wallet,
    userConnection: Connection,
    trove: Trove,
    vault: Vault,
    rewarderKey: PublicKey,
    quarryKey: PublicKey,
    minerKeys: Miner,
    mintPubKey: MintPubKey
  ) => {

    const confirmation = await createQuarryMinerCall(
      userConnection,
      userWallet,
      trove,
      vault,
      rewarderKey,
      quarryKey,
      minerKeys,
      mintPubKey
    );
    console.log("created miner: ", confirmation);
    const provider = new SignerWallet((programStablePool.provider.wallet as any).payer).createProvider(programStablePool.provider.connection);
    let sdk: QuarrySDK = QuarrySDK.load({provider});
    let rewarder = await sdk.mine.loadRewarderWrapper(rewarderKey);

    const poolMintToken = SToken.fromMint(mintPubKey, USDCUSDT_DECIMAL);
    let quarry = await rewarder.getQuarry(poolMintToken);
    
    const miner = await quarry.getMiner(trove.pubKey);
    assert(miner.authority.equals(trove.pubKey), "Miner'authority mismatch");
  };
  