// anchor imports
import { Program, web3, workspace, Wallet } from "@project-serum/anchor";
// solana imports
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
// utils
import { assert } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import { handleTxn } from "../utils/fxns";
import { Miner, MintPubKey, Trove, User, Vault } from "../utils/interfaces";
import { QuarrySDK, QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Token as SToken } from "@saberhq/token-utils";
import { DECIMALS_USDCUSDT } from "../utils/constants";
import { Accounts } from "../config/accounts";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;
// constants
// export const defaultAccounts = {
//   tokenProgram: TOKEN_PROGRAM_ID,
//   clock: SYSVAR_CLOCK_PUBKEY,
//   systemProgram: SystemProgram.programId,
//   rent: SYSVAR_RENT_PUBKEY,
//   associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
// };

/**
 * wasnt documented
 */
const createSaberQuarryMinerCall = async (
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
    programStablePool.instruction.createSaberQuarryMiner(miner.bump, {
      accounts: {
        authority: userWallet.publicKey,
        vault: vault.pubKey,
        trove: trove.pubKey,
        miner: miner.pubkey,
        quarry,
        rewarder,
        minerVault: miner.ata.pubKey,
        mint: tokenMint,
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
  accounts: Accounts,
  user: User
) => {
  const confirmation = await createSaberQuarryMinerCall(
    user.provider.connection, // userConnection,
    user.wallet, // userWallet,
    user.tokens.lpSaber.trove, // trove,
    accounts.lpSaberUsdcUsdt.vault, // vault,
    accounts.rewarderKey, // rewarderKey,
    accounts.quarryKey, // quarryKey,
    user.miner, // minerKeys,
    accounts.lpSaberUsdcUsdt.mint // mintPubKey
  );
  console.log("created miner: ", confirmation);

  const quarryProvider = new SignerWallet(
    (programStablePool.provider.wallet as any).payer
  ).createProvider(programStablePool.provider.connection);
  const sdk: QuarrySDK = QuarrySDK.load({ provider: quarryProvider });
  const rewarder = await sdk.mine.loadRewarderWrapper(accounts.rewarderKey);

  const poolMintToken = SToken.fromMint(
    accounts.lpSaberUsdcUsdt.mint,
    DECIMALS_USDCUSDT
  );
  const quarry = await rewarder.getQuarry(poolMintToken);

  const miner = await quarry.getMiner(user.tokens.lpSaber.trove.pubKey);
  assert(
    miner.authority.equals(user.tokens.lpSaber.trove.pubKey),
    "Miner'authority mismatch"
  );
};
