// anchor imports
import { BN, Program, Wallet, web3, workspace } from "@project-serum/anchor";
// solana imports
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  LAMPORTS_PER_SOL,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
// utils
import { assert, expect } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import { GlobalState } from "../interfaces/GlobalState";
import { Pool } from "../interfaces/pool";
import { TokenPda, TokenPDAUser } from "../interfaces/TokenPDA";
import { User } from "../interfaces/user";
import { Vault } from "../interfaces/vault";
import { DECIMALS_USDX } from "../utils/constants";
import { addZeros, handleTxn } from "../utils/fxns";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

const repayUsdxCall = async (
  amtToRepay: number,
  userConnection: Connection,
  userWallet: Wallet,
  tokenUsdxUser: TokenPDAUser,
  mintUsdx: TokenPda,
  pool: Pool,
  vault: Vault,
  globalState: GlobalState
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.repayUsdx(new BN(amtToRepay), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        mintUsdx: mintUsdx.pubKey,
        ataUsdx: tokenUsdxUser.ata.pubKey,

        // system accts
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
};

export const repayUsdxFAIL_RepayMoreThanBorrowed = async (
  user: User,
  accounts: Accounts
) => {
  const vault: Vault = user.tokens.lpSaber.vault;
  const repayAmountExcessUi = 1 * LAMPORTS_PER_SOL;
  const repayAmountExcessPrecise = addZeros(repayAmountExcessUi, DECIMALS_USDX);

  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> = await vault.getAccountInfo();
  assert(vaultInfo, "Test requires vault to already be created");

  const userUsdx = user.tokens.usdx;
  const ataUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPre = (await vault.getAccount()).debt.toNumber();

  assert(
    repayAmountExcessPrecise >= vaultDebtPre,
    "Test requires repay amount >= vault balance. Please increase repay amount." +
      `Repay Amount: ${repayAmountExcessPrecise}  ||  Vault Balance: ${vaultDebtPre}`
  );
  assert(
    repayAmountExcessPrecise <= ataUsdxBalPre,
    "Test requires that ATA balance be >= repay amount. Please increase ATA balance." +
      `Repay Amount: ${repayAmountExcessPrecise}  ||  ATA Balance: ${ataUsdxBalPre}`
  );

  await expect(
    repayUsdxCall(
      // amtToRepay
      repayAmountExcessPrecise,
      // userConnection
      user.provider.connection,
      // userWallet
      user.wallet,
      // tokenUsdxUser
      user.tokens.usdx,
      // mintUsdx
      accounts.usdx,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // vault
      user.tokens.lpSaber.vault,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith("6019"); // RepayingMoreThanBorrowed

  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPost = (await vault.getAccount()).debt.toNumber();
  const ataDiff = ataUsdxBalPost - ataUsdxBalPre;
  const vaultDiff = vaultDebtPost - vaultDebtPre;

  assert(
    ataDiff == 0,
    "Repay rejected but ata balance changed. ATA Diff: " + ataDiff
  );
  assert(
    vaultDiff == 0,
    "Repay rejected but vault debt changed. Vault Diff: " + vaultDiff
  );
};

export const repayUsdxPASS_RepayFullAmountBorrowed = async (
  user: User,
  accounts: Accounts
) => {
  const vault: Vault = user.tokens.lpSaber.vault;
  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();

  // check if global state exists
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> = await vault.getAccountInfo();
  assert(vaultInfo, "Test requires vault to already be created");

  const userUsdx = user.tokens.usdx;
  const ataUsdxBalPre = addZeros(
    (await userUsdx.ata.getBalance()).value.uiAmount,
    DECIMALS_USDX
  );
  const vaultDebtPre = (await vault.getAccount()).debt.toNumber();
  const repayAmountPrecise = ataUsdxBalPre;

  assert(
    ataUsdxBalPre === vaultDebtPre,
    "Test requires ataUsdxBal == vaultDebt. Please make these values equal." +
      `ATA Usdx Bal: ${ataUsdxBalPre}     Vault Debt : ${vaultDebtPre}`
  );

  await repayUsdxCall(
    // amtToRepay
    repayAmountPrecise,
    // userConnection
    user.provider.connection,
    // userWallet
    user.wallet,
    // tokenUsdxUser
    user.tokens.usdx,
    // mintUsdx
    accounts.usdx,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // vault
    user.tokens.lpSaber.vault,
    // globalState
    accounts.global
  );

  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPost = (await vault.getAccount()).debt.toNumber();

  assert(
    ataUsdxBalPost === 0,
    `ATA Bal not what expected \nATA Bal: ${ataUsdxBalPost} - Expected Bal: 0`
  );
  assert(
    vaultDebtPost === 0,
    `Vault Debt not what expected \nVault Debt: ${vaultDebtPost} - Expected Debt: 0`
  );
};

export const repayUsdxPASS_RepayLessThanBorrowed = async (
  user: User,
  vault: Vault,
  accounts: Accounts
) => {
  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> = await vault.getAccountInfo();
  assert(vaultInfo, "Test requires vault to already be created");

  const userUsdx = user.tokens.usdx;
  const ataUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPre = (await vault.getAccount()).debt.toNumber();

  const repayAmount = 1;

  assert(
    repayAmount <= vaultDebtPre,
    "Test requires repay amount <= vault balance. Please decrease repay amount. \n" +
      `Repay Amount: ${repayAmount}   Vault Balance: ${vaultDebtPre}`
  );
  assert(
    repayAmount <= ataUsdxBalPre,
    "Test requires that ATA balance be >= repay amount. Please increase ATA balance. \n" +
      `Repay Amount: ${repayAmount}    ATA Balance: ${ataUsdxBalPre}`
  );

  await repayUsdxCall(
    // amtToRepay
    repayAmount * LAMPORTS_PER_SOL,
    // userConnection
    user.provider.connection,
    // userWallet
    user.wallet,
    // tokenUsdxUser
    user.tokens.usdx,
    // mintUsdx
    accounts.usdx,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // vault
    user.tokens.lpSaber.vault,
    // globalState
    accounts.global
  );

  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPost = (await vault.getAccount()).debt.toNumber();
  const ataDiff = ataUsdxBalPost - ataUsdxBalPre;
  const vaultDiff = vaultDebtPost - vaultDebtPre;

  assert(
    ataDiff == -repayAmount,
    "ATA diff not what expected" +
      "ATA Diff: " +
      ataDiff +
      "Expected Diff: " +
      -repayAmount
  );
  assert(
    vaultDiff == -repayAmount,
    "Vault diff not what expected" +
      "Vault Diff: " +
      vaultDiff +
      "Expected Diff: " +
      -repayAmount
  );
};

export const repayUsdxFAIL_ZeroUsdx = async (
  user: User,
  vault: Vault,
  accounts: Accounts
) => {
  const repayAmount = 0;

  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user vault info
  const vaultInfo: web3.AccountInfo<Buffer> = await vault.getAccountInfo();
  assert(vaultInfo, "Test requires vault to already be created");

  const userUsdx = user.tokens.usdx;
  const ataUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPre = (await vault.getAccount()).debt.toNumber();

  assert(
    repayAmount == 0,
    "Test requires repay amount == 0 Repay Amount: " + repayAmount
  );

  await expect(
    repayUsdxCall(
      // amtToRepay
      repayAmount * LAMPORTS_PER_SOL,
      // userConnection
      user.provider.connection,
      // userWallet
      user.wallet,
      // tokenUsdxUser
      user.tokens.usdx,
      // mintUsdx
      accounts.usdx,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // vault
      user.tokens.lpSaber.vault,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith("6015"); // InvalidTransferAmount

  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPost = (await vault.getAccount()).debt.toNumber();
  const ataDiff = ataUsdxBalPost - ataUsdxBalPre;
  const vaultDiff = vaultDebtPost - vaultDebtPre;

  assert(
    ataDiff == 0,
    "Repay rejected but ata balance changed. ATA Diff: " + ataDiff
  );
  assert(
    vaultDiff == 0,
    "Repay rejected but vault debt changed. Vault Diff: " + vaultDiff
  );
};

export const repayUsdxFAIL_RepayAnotherUsersDebt = async (
  user: User,
  otherUser: User,
  otherUserVault: Vault, // TODO: vault -> vault
  accounts: Accounts
) => {
  const repayAmountUi = 1;
  const repayAmountPrecise = repayAmountUi * 10 ** DECIMALS_USDX;
  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user vault info
  assert(
    await otherUserVault.getAccount(),
    "Test requires vault to already be created"
  );

  const userUsdx = user.tokens.usdx;
  const userAtaUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const otherUserVaultDebtPre = (
    await otherUserVault.getAccount()
  ).debt.toNumber();

  assert(
    repayAmountPrecise <= userAtaUsdxBalPre,
    "Test requires repayAmount <= User Usdx Balance." +
      "User Usdx Balance: " +
      userAtaUsdxBalPre +
      " Repay Amount: " +
      repayAmountPrecise
  );
  assert(
    repayAmountPrecise <= otherUserVaultDebtPre,
    "Test requires repayAmount <= Other User Vault Debt." +
      "Repay Amount: " +
      repayAmountPrecise +
      " Other User Vault Debt: " +
      otherUserVaultDebtPre
  );

  await expect(
    repayUsdxCall(
      // amtToRepay
      repayAmountPrecise,
      // userConnection
      user.provider.connection,
      // userWallet
      user.wallet,
      // tokenUsdxUser
      user.tokens.usdx,
      // mintUsdx
      accounts.usdx,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // vault
      otherUser.tokens.lpSaber.vault,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith("2003"); // Raw Constraint Violated

  const userAtaUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const otherUserVaultDebtPost = (
    await otherUserVault.getAccount()
  ).debt.toNumber();
  const ataDiff = userAtaUsdxBalPost - userAtaUsdxBalPre;
  const vaultDiff = otherUserVaultDebtPost - otherUserVaultDebtPre;

  assert(
    ataDiff == 0,
    "Repay rejected but ata balance changed. ATA Diff: " + ataDiff
  );
  assert(
    vaultDiff == 0,
    "Repay rejected but vault debt changed. Vault Diff: " + vaultDiff
  );
};
