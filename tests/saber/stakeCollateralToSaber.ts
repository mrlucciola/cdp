// anchor/solana
import {
  BN,
  IdlAccounts,
  Program,
  Wallet,
  workspace,
} from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
// quarry
import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// local
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import {
  GlobalStateAcct,
  MintPubKey,
  Pool,
  UserToken,
  Vault,
} from "../utils/interfaces";
import { assert } from "chai";
import { handleTxn } from "../utils/fxns";
import { DECIMALS_USD, DECIMALS_USDCUSDT } from "../utils/constants";
import { User } from "../interfaces/user";
import { Miner } from "../interfaces/miner";

const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * * we have params and their classes like this so we can guarantee-
 *     we are passing in the right values
 * zhaohui wrote this
 */
const stakeToSaberCall = async (
  amountToStake: number,
  userConnection: Connection,
  userWallet: Wallet,
  userToken: UserToken,
  vault: Vault,
  mintPubKey: MintPubKey,
  pool: Pool,
  globalState: GlobalStateAcct,
  rewarder: PublicKey,
  quarry: PublicKey,
  miner: Miner
) => {
  console.log("ata balance: ", await userToken.ata.getBalance());
  const txn = new Transaction().add(
    programStablePool.instruction.stakeCollateralToSaber(
      new BN(amountToStake),
      {
        accounts: {
          authority: userWallet.publicKey,
          globalState: globalState.pubKey,
          pool: pool.pubKey,
          vault: vault.pubKey,
          ataVault: vault.ata.pubKey,
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
      }
    )
  );

  await handleTxn(txn, userConnection, userWallet);
};

export const stakeCollateralToSaberPASS = async (
  user: User,
  accounts: Accounts
) => {
  const amountToStakeUi = 0.2;
  const amountToStakePrecise = amountToStakeUi * 10 ** DECIMALS_USDCUSDT;
  const priceUsd = 1; // TODO: fix price feed
  const globalStateAcct: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();

  const userlpSaber = user.tokens.lpSaber;

  // const tvlPre = globalStateAcct.tvlUsd.toNumber();
  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);
  const vaultBalPre = Number(
    (await userlpSaber.vault.ata.getBalance()).value.amount
  );

  assert(
    userBalPre >= amountToStakePrecise,
    "Test requires ATA balance to be >= deposit amount. Please decrease deposit amount" +
      `\n ATA Balance: ${userBalPre} < Stake Amount: ${amountToStakePrecise}`
  );

  // TODO: get the real world oracle values from here, make a query
  assert(
    amountToStakePrecise * priceUsd +
      globalStateAcct.tvlUsd.toNumber() / 10 ** DECIMALS_USD <
      globalStateAcct.tvlLimit.toNumber() / 10 ** DECIMALS_USD,
    "Amount attempting to deposit will exceed TVL limit. Please decrease amountToStakePrecise.\n" +
      `\nDeposit Amount USD: ${amountToStakePrecise * priceUsd}` +
      `\nTVL: ${globalStateAcct.tvlUsd.toNumber() / 10 ** DECIMALS_USD}` +
      `\nTVL Limit: ${globalStateAcct.tvlLimit.toNumber() / 10 ** DECIMALS_USD}`
  );

  await stakeToSaberCall(
    // deposit amount
    amountToStakePrecise,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // user token
    user.tokens.lpSaber,
    // vault
    user.tokens.lpSaber.vault,
    // mint pubKey
    accounts.lpSaberUsdcUsdt.mint,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // globalState
    accounts.global,
    // quarry-mine rewader
    // TODO 002: move quarry into pool class
    accounts.quarry.rewarder, // .rewarderKey
    // quarry-mine quarry
    // TODO 002: move quarry into pool class
    accounts.quarry.pubkey,
    ///quarry-mine miner of vault
    user.miner
  );

  const userBalPost = (await userlpSaber.ata.getBalance()).value.uiAmount;
  const vaultBalPost = (await userlpSaber.vault.ata.getBalance()).value
    .uiAmount;
  const userDiff = userBalPost - userBalPre;

  console.log(`user balance: ${userBalPre} -> ${userBalPost} ∆=${userDiff}`);
  console.log(`vault balance: ${vaultBalPre} -> ${vaultBalPost}`);
  // console.log(`farm balance: ${quarryBalPre} -> ${quarryBalPost}`);

  const differenceThreshold = 0.0001; // set arbitrarily
  // assert(
  //   Math.abs(amountToStakePrecise + userDiff) < differenceThreshold,
  //   "Expected User ATA Diff: " +
  //     -amountToStakePrecise +
  //     " Actual User ATA Diff: " +
  //     userDiff
  // );
  // assert(
  //   vaultBalPost.toFixed() == "0",
  //   "Expected vault ata balance to be zero"
  // );
};
