// anchor/solana
import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
// saber
import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// utils
import { StablePool } from "../../target/types/stable_pool";
// interfaces
import { Miner } from "../interfaces/miner";
import { QuarryClass } from "../interfaces/quarry";
import { User } from "../interfaces/user";
import {
  GlobalStateAcct,
  MintPubKey,
  Pool,
  UserToken,
  Vault,
} from "../utils/interfaces";
import { handleTxn } from "../utils/fxns";
import { Accounts } from "../config/accounts";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

export const depositAndStakeCollatCall = async (
  depositAmount: number,
  userWallet: Wallet,
  userConnection: Connection,
  globalState: GlobalStateAcct,
  pool: Pool,
  vault: Vault,
  user: User,
  userToken: UserToken,
  mintPubKey: MintPubKey,
  quarry: QuarryClass,
  miner: Miner,
  rewarder: PublicKey
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.depositCollateral(new BN(depositAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        userState: user.userState.pubKey,
        ataCollatVault: vault.ata.pubKey,
        ataCollatUser: userToken.ata.pubKey,
        mintCollat: mintPubKey,
        oracleA: pool.oracles.usdc.pubKey,
        oracleB: pool.oracles.usdt.pubKey,
        ataMarketA: pool.ataMarketTokens.usdc.pubKey,
        ataMarketB: pool.ataMarketTokens.usdt.pubKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    })
  );
  txn.add(
    programStablePool.instruction.stakeCollateralToSaber({
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        ataCollatVault: vault.ata.pubKey,
        // TODO 028: Delete
        ataUser: userToken.ata.pubKey,
        mint: mintPubKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        quarry,
        miner: miner.pubkey,
        minerVault: miner.ata.pubKey,
        rewarder,
        quarryProgram: QUARRY_ADDRESSES.Mine,
      },
    })
  );

  // send the txn
  await handleTxn(txn, userConnection, userWallet);
};

export const depositAndStakeCollatPASS = async (
  user: User,
  accounts: Accounts,
  depositAmt
) => {
  await depositAndStakeCollatCall(
    depositAmt,
    user.wallet,
    user.provider.connection,
    accounts.global,
    accounts.lpSaberUsdcUsdt.pool,
    user.tokens.lpSaber.vault,
    user,
    user.tokens.lpSaber,
    accounts.lpSaberUsdcUsdt.mint,
    accounts.quarry,
    user.miner,
    accounts.quarry.rewarder
  );
};
