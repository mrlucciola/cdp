// anchor imports
import {
  Program,
  workspace,
  IdlAccounts,
  Wallet,
  BN,
} from "@project-serum/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
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
import { MintPubKey } from "../utils/interfaces";
import { Accounts } from "../config/accounts";
import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
import { DECIMALS_USDCUSDT } from "../utils/constants";
import { Pool } from "../interfaces/pool";
import { Miner } from "../interfaces/miner";
import { User } from "../interfaces/user";
import { Vault } from "../interfaces/vault";
import { GlobalState } from "../interfaces/GlobalState";
import { TokenCollatUser } from "../interfaces/TokenCollatUser";
// program
const programStablePool = workspace.StablePool as Program<StablePool>;

const stakeToSaberNewlyCall = async (
  amountToDeposit: number,
  userConnection: Connection,
  userWallet: Wallet,
  vault: Vault,
  pool: Pool,
  mintPubKey: MintPubKey,
  rewardMint: MintPubKey,
  rewarder: PublicKey,
  quarry: PublicKey,
  miner: Miner,
  globalState: GlobalState,
  userToken: TokenCollatUser
) => {
  const txn = new Transaction();
  const createVaultIx = programStablePool.instruction.createVault(
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
  );
  const createRewardVaultIx = programStablePool.instruction.createRewardVault({
    accounts: {
      authority: userWallet.publicKey,
      pool: pool.pubKey,
      vault: vault.pubKey,

      ataRewardVault: vault.ataRewards[0].pubKey,
      mintReward: rewardMint,

      // system accts
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    },
  });
  const createMinerIx = programStablePool.instruction.createSaberQuarryMiner(
    miner.bump,
    {
      accounts: {
        authority: userWallet.publicKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        miner: miner.pubkey,
        quarry,
        rewarder,
        minerVault: miner.ata.pubKey,
        mint: mintPubKey,
        quarryProgram: QUARRY_ADDRESSES.Mine,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    }
  );
  const depositIx = programStablePool.instruction.depositCollateral(
    new BN(amountToDeposit),
    {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        ataVault: vault.ata.pubKey,
        ataUser: userToken.ata.pubKey,
        mintCollat: mintPubKey,
        oracleA: pool.oracles.usdc.pubKey,
        oracleB: pool.oracles.usdt.pubKey,
        ataMarketA: pool.ataMarketTokens.usdc.pubKey,
        ataMarketB: pool.ataMarketTokens.usdt.pubKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    }
  );
  const stakeToSaberIx = programStablePool.instruction.stakeCollateralToSaber({
    accounts: {
      authority: userWallet.publicKey,
      globalState: globalState.pubKey,
      pool: pool.pubKey,
      vault: vault.pubKey,
      ataVault: vault.ata.pubKey,
      mint: mintPubKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      quarry,
      miner: miner.pubkey,
      minerVault: miner.ata.pubKey,
      rewarder,
      quarryProgram: QUARRY_ADDRESSES.Mine,
    },
  });
  txn.add(
    ...[
      createVaultIx,
      createRewardVaultIx,
      createMinerIx,
      depositIx,
      stakeToSaberIx,
    ]
  );
  // send transaction
  const receipt = await handleTxn(txn, userConnection, userWallet);

  return receipt;
};

/**
 * Pass when attempting to make a vault that doesn't exist
 */
export const stakeToSaberNewlyPASS = async (user: User, accounts: Accounts) => {
  // derive vault account
  console.log("getting vault acct");
  const amountToDeposit = 2;
  const amountToDepositPrecise = amountToDeposit * 10 ** DECIMALS_USDCUSDT;
  await stakeToSaberNewlyCall(
    amountToDepositPrecise,
    user.provider.connection,
    user.wallet,
    user.tokens.lpSaber.vault,
    accounts.lpSaberUsdcUsdt.pool,
    accounts.lpSaberUsdcUsdt.mint,
    accounts.sbr.mint,
    accounts.lpSaberUsdcUsdt.pool.quarry.rewarder, // rewarderKey,
    accounts.quarryKey, // quarryKey,
    user.miner,
    // globalState
    accounts.global,
    user.tokens.lpSaber
  );

  // get the user vault state
  const vaultLpSaberAcct: IdlAccounts<StablePool>["vault"] =
    await user.tokens.lpSaber.vault.getAccount();
  console.log(
    "vaultLpSaberAcct.lockedCollBalance:",
    vaultLpSaberAcct.depositedCollatUsd.toNumber()
  );
  // final asserts
  assert(
    vaultLpSaberAcct.depositedCollatUsd.toNumber() == amountToDepositPrecise,
    "deposit amount mismatch"
  );
};
