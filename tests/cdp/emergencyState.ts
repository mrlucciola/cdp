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
import { Connection, Transaction } from "@solana/web3.js";
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import { handleTxn } from "../utils/fxns";
import {
  GlobalStateAcct,
  MintPubKey,
  Vault,
  UserToken,
  Pool,
} from "../utils/interfaces";
import { User } from "../interfaces/user";
import { assert, expect } from "chai";
import {
  DECIMALS_PRICE,
  DECIMALS_USDCUSDT,
  DECIMALS_USDX,
  EMER_STATE_DISABLED,
  EMER_STATE_ENABLED,
} from "../utils/constants";
import { toggleEmerStateCall } from "../admin-panel/toggleEmerState";
import { depositCollateralCall} from "./depositCollateral";
import { withdrawCollateralCall } from "./withdrawCollateral";
import { borrowUsdxCall } from "./borrowUsdx";
  
const programStablePool = workspace.StablePool as Program<StablePool>;
  
export const emergencyStatePASS_DepositDisabled = async (
  superUser: User,
  user: User,
  accounts: Accounts
) => {
  const depositAmount = 0.2 * 10 ** DECIMALS_USDCUSDT;
  
  let globalState: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();

  if (globalState.paused == EMER_STATE_DISABLED) {
    let confirmation = await toggleEmerStateCall(accounts, superUser, EMER_STATE_ENABLED);
    assert(confirmation, "Failed to enable emergency state");
    globalState = await accounts.global.getAccount();
    assert(globalState.paused == EMER_STATE_ENABLED, "Failed to enable emergency state");
  }

  const userlpSaber = user.tokens.lpSaber;

  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);
  const vaultBalPre = Number((await userlpSaber.vault.ata.getBalance()).value.amount);

  assert(
    userBalPre >= depositAmount,
    "Test requires ATA balance to be >= deposit amount. Please increase deposit amount" +
      `\nATA bal.: ${userBalPre}   deposit amt: ${depositAmount}`
  );

  await expect(
    depositCollateralCall(
      // deposit amount
      depositAmount,
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
      accounts.global
    )
  ).to.be.rejectedWith(
    "6005", // NotAllowed
    "No error was thrown when trying to deposit during an emergency state"
  );

  const userBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);
  const vaultBalPost = Number((await userlpSaber.vault.ata.getBalance()).value.amount);

  assert(userBalPre == userBalPost, "User Bal changed despite deposit being rejected");
  assert(vaultBalPre == vaultBalPost, "Vault Bal changed depsite deposit being rejected");
};

export const emergencyStatePASS_BorrowDisabled = async (
  superUser: User,
  user: User,
  accounts: Accounts
) => {
  const borrowAmount = 10 * 10 ** DECIMALS_USDX;
  const usdxUser = user.tokens.usdx;

  const userUsdxBalPre = Number((await usdxUser.ata.getBalance()).value.amount);

  let globalState: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();

  // Disable emergency state if necessary
  if (globalState.paused == EMER_STATE_DISABLED) {
    let confirmation = await toggleEmerStateCall(accounts, superUser, EMER_STATE_ENABLED);
    assert(confirmation, "Failed to enable emergency state");
    globalState = await accounts.global.getAccount();
    assert(globalState.paused == EMER_STATE_ENABLED, "Failed to enable emergency state");
  }

  await expect(
    borrowUsdxCall(
      // borrow/mint amount
      borrowAmount,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // userToken
      user.tokens.lpSaber,
      // userUSDx
      user.tokens.usdx,
      // mintUsdx
      accounts.usdx,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // globalState
      accounts.global,
      // mintColl
      accounts.lpSaberUsdcUsdt.mint
    )
  ).to.be.rejectedWith(
    "6005", // NotAllowed
    "No error thrown when trying to borrow when emergency state enabled"
  );

  const userUsdxBalPost = Number((await usdxUser.ata.getBalance()).value.amount);

  assert(userUsdxBalPre == userUsdxBalPost, "User Bal changed despite borrow being rejected");
};

export const emergencyStatePASS_WithdrawDisabled = async (
  superUser: User,
  user: User,
  accounts: Accounts
) => {
  const withdrawAmount = 0.1 * 10 ** DECIMALS_USDCUSDT;
  const userlpSaber = user.tokens.lpSaber;

  // check balances before
  const vaultBalPre = Number((await userlpSaber.vault.ata.getBalance()).value.amount);
  const userBalPre = Number((await userlpSaber.ata.getBalance()).value.amount);

  // let globalStateAcct: IdlAccounts<StablePool>["globalState"] = await accounts.global.getAccount();
  // const tvlPre = globalStateAcct.tvlUsd.toNumber();

  assert(
    withdrawAmount <= vaultBalPre,
    "Test requires withdrawing an amount less than the vault balance so it will succeed.\n" +
      `Withdraw Amount: ${withdrawAmount}   Vault Balance: ${vaultBalPre}`
  );

  let globalState: IdlAccounts<StablePool>["globalState"] =
    await accounts.global.getAccount();

  // Disable emergency state if necessary
  if (globalState.paused == EMER_STATE_DISABLED) {
    let confirmation = await toggleEmerStateCall(accounts, superUser, EMER_STATE_ENABLED);
    assert(confirmation, "Failed to enable emergency state");
    globalState = await accounts.global.getAccount();
    assert(globalState.paused == EMER_STATE_ENABLED, "Failed to enable emergency state");
  }

  await expect(
    withdrawCollateralCall(
      // withdraw amount
      withdrawAmount,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // user token
      userlpSaber,
      // user vault
      userlpSaber.vault,
      // mint pubKey
      accounts.lpSaberUsdcUsdt.mint,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith(
    "6005", // NotAllowed
    "No error thrown when trying to withdraw when emergency state enabled"
  );

  // check balances after
  const vaultBalPost = Number((await userlpSaber.vault.ata.getBalance()).value.amount);
  const userBalPost = Number((await userlpSaber.ata.getBalance()).value.amount);

  assert(userBalPre == userBalPost, "User Bal changed despite withdraw being rejected");
  assert(vaultBalPre == vaultBalPost, "Vault Bal changed depsite withdraw being rejected");

  globalState = await accounts.global.getAccount();

  // Unpause emergency state
  if (globalState.paused == EMER_STATE_ENABLED) {
    let confirmation = await toggleEmerStateCall(accounts, superUser, EMER_STATE_DISABLED);
    assert(confirmation, "Failed to disable emergency state");
    globalState = await accounts.global.getAccount();
    assert(globalState.paused == EMER_STATE_DISABLED, "Failed to disable emergency state");
  }
};

  