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
import { assert, expect } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import { DECIMALS_USDCUSDT } from "../utils/constants";
import { handleTxn } from "../utils/fxns";
// interfaces
import { Accounts } from "../config/accounts";
import {
  GlobalStateAcct,
  MintPubKey,
  Vault,
  UserToken,
  Pool,
} from "../utils/interfaces";
import { User } from "../interfaces/user";
import { Miner } from "../interfaces/miner";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * * we have params and their classes like this so we can guarantee-
 *     we are passing in the right values
 */
const unstakeColalteralFromSaberCall = async (
  unstakeAmount: number,
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
  const txn = new Transaction().add(
    programStablePool.instruction.unstakeCollateralFromSaber(
      new BN(unstakeAmount),
      {
        accounts: {
          authority: userWallet.publicKey,
          globalState: globalState.pubKey,
          pool: pool.pubKey,
          vault: vault.pubKey,
          ataCollatVault: vault.ata.pubKey,
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

export const unstakeColalteralFromSaberFAIL_AttemptToUnstakeMoreThanWasStaked =
  async (user: User, accounts: Accounts) => {
    const unstakeAmountUi = 4000;
    const unstakeAmountPrecise = unstakeAmountUi * 10 ** DECIMALS_USDCUSDT;
    const userlpSaber = user.tokens.lpSaber;

    // check balances before
    const lockedBalPre = (await userlpSaber.vault.getAccount())
      .lockedCollBalance;
    const vaultBalPre = (await userlpSaber.vault.ata.getBalance()).value
      .uiAmount;
    const userBalPre = (await userlpSaber.ata.getBalance()).value.uiAmount;
    // TODO 007: move miner into its respective user-token relationship
    const minerBalPre = (await user.miner.ata.getBalance()).value.uiAmount;

    assert(
      unstakeAmountPrecise >= lockedBalPre,
      "Test requires unstaking an amount less than the vault balance so it won't succeed.\n" +
        "Unstake Amount: " +
        unstakeAmountPrecise +
        " Vault Balance: " +
        lockedBalPre
    );

    await expect(
      unstakeColalteralFromSaberCall(
        // withdraw amount
        unstakeAmountPrecise,
        // user connection
        user.provider.connection,
        // user wallet
        user.wallet,
        // user token
        userlpSaber,
        // vault
        userlpSaber.vault,
        // mint pubKey
        accounts.lpSaberUsdcUsdt.mint,
        // pool
        accounts.lpSaberUsdcUsdt.pool,
        // globalState
        accounts.global,
        ///quarry-mine rewader
        // TODO 002: move quarry into pool class
        accounts.quarry.rewarder,
        ///quarry-mine quarry
        // TODO 002: move quarry into pool class
        accounts.quarry.pubkey,
        ///quarry-mine miner of vault
        user.miner
      )
    ).to.be.rejectedWith(
      "6001",
      "No error was thrown when trying to unstake an amount more than was staked"
    );

    // check balances after
    const lockedBalPost = (await userlpSaber.vault.getAccount())
      .lockedCollBalance;
    const vaultBalPost = (await userlpSaber.vault.ata.getBalance()).value
      .uiAmount;
    const userBalPost = (await userlpSaber.ata.getBalance()).value.uiAmount;

    assert(
      lockedBalPost - lockedBalPre == 0,
      "Locked Balance Changed Despite Transaction Failing"
    );
    assert(
      vaultBalPost - vaultBalPre == 0,
      "Vault Balance Changed Despite Transaction Failing"
    );
    assert(
      userBalPost - userBalPre == 0,
      "User ATA Balance Changed Despite Transaction Failing"
    );
  };

export const unstakeColalteralFromSaberFAIL_AttemptToUnstakeFromAnotherUser =
  async (user: User, otherUser: User, accounts: Accounts) => {
    const unstakeAmountUi = 0.2;
    const unstakeAmountPrecise = unstakeAmountUi * 10 ** DECIMALS_USDCUSDT;
    const userlpSaber = user.tokens.lpSaber;
    const otherUserLpSaber = otherUser.tokens.lpSaber;

    // check balances before
    const lockedBalPre = (await userlpSaber.vault.getAccount())
      .lockedCollBalance;
    const vaultBalPre = (await userlpSaber.vault.ata.getBalance()).value
      .uiAmount;
    const userBalPre = (await userlpSaber.ata.getBalance()).value.uiAmount;

    assert(
      unstakeAmountPrecise <= lockedBalPre,
      "Test requires unstaking an amount less than the vault balance so it could succeed.\n" +
        "Unstake Amount: " +
        unstakeAmountPrecise +
        " Vault Balance: " +
        lockedBalPre
    );

    await expect(
      unstakeColalteralFromSaberCall(
        // withdraw amount
        unstakeAmountPrecise,
        // other user connection
        otherUser.provider.connection,
        // other user wallet
        otherUser.wallet,
        // other user token
        otherUserLpSaber,
        // user vault (since other user is trying to withdraw for them)
        userlpSaber.vault,
        // mint pubKey
        accounts.lpSaberUsdcUsdt.mint,
        // pool
        accounts.lpSaberUsdcUsdt.pool,
        // globalState
        accounts.global,
        // quarry-mine rewader
        // TODO 002: move quarry into pool class
        accounts.quarry.rewarder,
        // quarry-mine quarry
        // TODO 002: move quarry into pool class
        accounts.quarry.pubkey,
        ///quarry-mine miner of vault
        user.miner
      )
    ).to.be.rejectedWith(
      "2006",
      "No error was thrown when trying to unstake from another user's staked collateral"
    );

    // check balances after
    const lockedBalPost = (await userlpSaber.vault.getAccount())
      .lockedCollBalance;
    const vaultBalPost = (await userlpSaber.vault.ata.getBalance()).value
      .uiAmount;
    const userBalPost = (await userlpSaber.ata.getBalance()).value.uiAmount;

    assert(
      lockedBalPost - lockedBalPre == 0,
      "Locked Balance Changed Despite Transaction Failing"
    );
    assert(
      vaultBalPost - vaultBalPre == 0,
      "Vault Balance Changed Despite Transaction Failing"
    );
    assert(
      userBalPost - userBalPre == 0,
      "User ATA Balance Changed Despite Transaction Failing"
    );
  };

export const unstakeColalteralFromSaberPASS = async (
  user: User,
  accounts: Accounts
) => {
  const unstakeAmountUi = 0.2;
  const unstakeAmountPrecise = unstakeAmountUi * 10 ** DECIMALS_USDCUSDT;
  const userLpSaber = user.tokens.lpSaber;

  // check balances before
  const lockedBalPre = (await userLpSaber.vault.getAccount()).lockedCollBalance;
  const vaultBalPre = (await userLpSaber.vault.ata.getBalance()).value.uiAmount;
  const minerBalPre = (await user.miner.ata.getBalance()).value.uiAmount;

  assert(
    unstakeAmountPrecise <= lockedBalPre,
    "Test requires unstaking an amount less than the vault balance so it will succeed.\n" +
      "Unstake Amount: " +
      unstakeAmountPrecise +
      " Vault Balance: " +
      lockedBalPre
  );

  await unstakeColalteralFromSaberCall(
    // withdraw amount
    unstakeAmountPrecise,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // user token
    userLpSaber,
    // vault
    userLpSaber.vault,
    // mint pubKey
    accounts.lpSaberUsdcUsdt.mint,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // globalState
    accounts.global,
    // quarry-mine rewader
    // TODO 002: move quarry into pool class
    accounts.quarry.rewarder,
    // quarry-mine quarry
    // TODO 002: move quarry into pool class
    accounts.quarry.pubkey,
    ///quarry-mine miner of vault
    user.miner
  );

  // check balances after
  const lockedBalPost = (await userLpSaber.vault.getAccount())
    .lockedCollBalance;
  const vaultBalPost = (await userLpSaber.vault.ata.getBalance()).value
    .uiAmount;
  const minerBalPost = (await user.miner.ata.getBalance()).value.uiAmount;

  const lockedBalDiff = lockedBalPost - lockedBalPre;
  const vaultBalDiff = vaultBalPost - vaultBalPre;
  const minerBalDiff = minerBalPre - vaultBalPre;

  const differenceThreshold = 0.0001; // set arbitrarily
  assert(
    Math.abs(lockedBalDiff + unstakeAmountPrecise) < differenceThreshold,
    `Expected Locked Bal Diff: ${-unstakeAmountUi}   Actual Locked Bal Diff: ${lockedBalDiff}`
  );
  // assert(
  //   vaultBalDiff == 0,
  //   "Expected Vault Bal Diff: 0" + " Actual Vault Bal Diff: " + vaultBalDiff
  // );
  // assert(
  //   Math.abs(userDiff - unstakeAmountUi) < differenceThreshold,
  //   "Expected User ATA Diff: " +
  //     unstakeAmountUi +
  //     " Actual User ATA Diff: " +
  //     userDiff
  // );
  // assert(
  //   vaultBalPost.toString() == "0",
  //   "Expected Vault ata balance to be zero"
  // );

  // TODO 006: check if the miner balance decreased and vault value increased
};
