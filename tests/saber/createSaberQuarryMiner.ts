// anchor imports
import { Program, web3, workspace, Wallet } from "@project-serum/anchor";
// solana imports
import { Connection, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
import { Token as SToken } from "@saberhq/token-utils";
// utils
import { assert } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
// import { Periphery } from "../../target/types/periphery";
import { handleTxn } from "../utils/fxns";
import { MintPubKey } from "../utils/interfaces";
import { DECIMALS_USDCUSDT } from "../utils/constants";
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";
import { Miner } from "../interfaces/miner";
import { QuarryClass } from "../interfaces/quarry";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;
// const programPeriphery = workspace.Periphery as Program<Periphery>;

/**
 * wasnt documented
 */
const createSaberQuarryMinerCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  vault: Vault,
  pool: Pool,
  quarry: QuarryClass, // quarry: PublicKey,
  miner: Miner,
  tokenMint: MintPubKey
) => {
  console.log({
    accounts: {
      authority: userWallet.publicKey,
      pool: pool.pubKey,
      vault: vault.pubKey,
      miner: miner.pubkey,
      ataCollatMiner: miner.ata.pubKey,
      // quarry
      quarry: quarry.pubkey,
      rewarder: quarry.rewarder,
      mintCollat: tokenMint,
      quarryProgram: QUARRY_ADDRESSES.Mine,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    },
  })
  console.log({
    accounts: {
      authority: await userConnection.getAccountInfo( userWallet.publicKey),
      pool: await userConnection.getAccountInfo( pool.pubKey),
      vault: await userConnection.getAccountInfo( vault.pubKey),
      miner: await userConnection.getAccountInfo( miner.pubkey),
      ataCollatMiner: await userConnection.getAccountInfo( miner.ata.pubKey),
      // quarry
      quarry: await userConnection.getAccountInfo(quarry.pubkey),
      rewarder: await userConnection.getAccountInfo(quarry.rewarder),
      mintCollat: await userConnection.getAccountInfo(tokenMint),
      quarryProgram: QUARRY_ADDRESSES.Mine,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    },
  })
  const txn = new web3.Transaction().add(
    // programPeriphery.instruction.createSaberQuarryMiner(miner.bump, {
    programStablePool.instruction.createSaberQuarryMiner(miner.bump, {
      accounts: {
        authority: userWallet.publicKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        miner: miner.pubkey,
        ataCollatMiner: miner.ata.pubKey,
        // quarry
        quarry: quarry.pubkey,
        rewarder: quarry.rewarder,
        mintCollat: tokenMint,
        quarryProgram: QUARRY_ADDRESSES.Mine,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      },
    })
  );
  // send transaction
  const receipt = await handleTxn(txn, userConnection, userWallet);
  console.log("receipt", receipt);
  return receipt;
};

/**
 * Pass when attempting to make a quarry miner that doesn't exist
 */
export const createSaberQuarryMinerPASS = async (
  user: User,
  accounts: Accounts
) => {
  const minerUser = user.tokens.lpSaber.vault.miner;
  console.log(
    "miner account",
    minerUser.pubkey,
    "\n pub key",
    minerUser.pubkey.toString()
  );
  const confirmation = await createSaberQuarryMinerCall(
    user.provider.connection, // userConnection,
    user.wallet, // userWallet,
    user.tokens.lpSaber.vault, // vault,
    accounts.lpSaberUsdcUsdt.pool, // pool,
    // accounts.rewarderKey, // rewarderKey,
    accounts.lpSaberUsdcUsdt.pool.quarry, // quarryKey,
    minerUser, // minerKeys,
    accounts.lpSaberUsdcUsdt.mint // mintPubKey
  );
  console.log("created miner: ", confirmation);

  // user.
  // const sdk: QuarrySDK = QuarrySDK.load({ provider: accounts.quarry.provider });
  // const rewarder = await sdk.mine.loadRewarderWrapper(accounts.rewarderKey);
  // const rewarderWrapper = await accounts.quarry.sdk.mine.loadRewarderWrapper(accounts.quarry.rewarder); // accounts.rewarderKey

  // create the SToken for collateral (usdc usdt lp) mint  prev poolMintToken
  const mintCollatSToken = SToken.fromMint(
    accounts.lpSaberUsdcUsdt.mint,
    DECIMALS_USDCUSDT
  );

  // get the miner. param is the authority
  const miner =
    await accounts.lpSaberUsdcUsdt.pool.quarry.quarryWrapper.getMiner(
      user.tokens.lpSaber.vault.pubKey
    );
  assert(
    miner.authority.equals(user.tokens.lpSaber.vault.pubKey),
    "Miner'authority mismatch"
  );
};
