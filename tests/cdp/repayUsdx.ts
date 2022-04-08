// anchor imports
import {
  BN,
  IdlAccounts,
  Program,
  Wallet,
  web3,
  workspace,
} from "@project-serum/anchor";
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
import { User } from "../interfaces/user";
import { DECIMALS_USDX } from "../utils/constants";
import { handleTxn } from "../utils/fxns";
import {
  GlobalStateAcct,
  MintAcct,
  Pool,
  Vault,
  UserToken,
} from "../utils/interfaces";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

const repayUsdxCall = async (
  repayAmount: number,
  userConnection: Connection,
  userWallet: Wallet,
  userToken: UserToken,
  mintUsdx: MintAcct,
  pool: Pool,
  vault: Vault,
  globalState: GlobalStateAcct
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.repayUsdx(new BN(repayAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        vault: vault.pubKey, // TODO: vault -> vault
        mintUsdx: mintUsdx.pubKey,
        ataUsdx: userToken.ata.pubKey,

        // system accts
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
};

export const repayUsdxFAIL_RepayMoreThanBorrowed = async (
  user: User,
  vault: Vault, // TODO: vault -> vault
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
  const vaultInfo: web3.AccountInfo<Buffer> = await vault.getAccountInfo();
  assert(vaultInfo, "Test requires vault to already be created");

  const userUsdx = user.tokens.usdx;
  let vaultAcct: IdlAccounts<StablePool>["vault"] = await vault.getAccount();
  const ataUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPre = vaultAcct.debt.toNumber();

  assert(
    repayAmountPrecise >= vaultDebtPre,
    "Test requires repay amount >= vault balance. Please increase repay amount." +
      "Repay Amount: " +
      repayAmountPrecise +
      " Vault Balance :" +
      vaultDebtPre
  );
  assert(
    repayAmountPrecise <= ataUsdxBalPre,
    "Test requires that ATA balance be >= repay amount. Please increase ATA balance." +
      "Repay Amount: " +
      repayAmountPrecise +
      " ATA Balance: " +
      ataUsdxBalPre
  );

  await expect(
    repayUsdxCall(
      // borrow/mint amount
      repayAmountPrecise * LAMPORTS_PER_SOL,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // user token
      user.tokens.lpSaber,
      // mintUsdx MintAcct
      accounts.usdx,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // vault
      user.tokens.lpSaber.vault,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith("6019"); // RepayingMoreThanBorrowed

  vaultAcct = await vault.getAccount();
  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPost = vaultAcct.debt.toNumber();
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
  let vaultAcct: IdlAccounts<StablePool>["vault"] = await vault.getAccount();
  const ataUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPre = vaultAcct.debt.toNumber();
  const repayAmountPrecise = ataUsdxBalPre;

  assert(
    ataUsdxBalPre == vaultDebtPre,
    "Test requires ataUsdxBal == vaultDebt. Please make these values equal." +
      "ATA Usdx Bal: " +
      ataUsdxBalPre +
      " Vault Balance :" +
      vaultDebtPre
  );

  await repayUsdxCall(
    // borrow/mint amount
    repayAmountPrecise * LAMPORTS_PER_SOL,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // user token
    user.tokens.lpSaber,
    // mintUsdx MintAcct
    accounts.usdx,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // vault
    user.tokens.lpSaber.vault,
    // globalState
    accounts.global
  );

  vaultAcct = await vault.getAccount();
  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPost = vaultAcct.debt.toNumber();

  assert(
    ataUsdxBalPost == 0,
    "ATA Bal not what expected" +
      "ATA Bal: " +
      ataUsdxBalPost +
      " Expected Bal: 0"
  );
  assert(
    vaultDebtPost == 0,
    "Vault Debt not what expected" +
      "Vault Debt: " +
      vaultDebtPost +
      " Expected Debt: 0"
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
  let vaultAcct: IdlAccounts<StablePool>["vault"] = await vault.getAccount();
  const ataUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPre = vaultAcct.debt.toNumber();

  const repayAmount = 1;

  assert(
    repayAmount <= vaultDebtPre,
    "Test requires repay amount <= vault balance. Please decrease repay amount." +
      "Repay Amount: " +
      repayAmount +
      " Vault Balance :" +
      vaultDebtPre
  );
  assert(
    repayAmount <= ataUsdxBalPre,
    "Test requires that ATA balance be >= repay amount. Please increase ATA balance." +
      "Repay Amount: " +
      repayAmount +
      " ATA Balance: " +
      ataUsdxBalPre
  );

  await repayUsdxCall(
    // borrow/mint amount
    repayAmount * LAMPORTS_PER_SOL,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // user token
    user.tokens.lpSaber,
    // mintUsdx MintAcct
    accounts.usdx,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // vault
    user.tokens.lpSaber.vault,
    // globalState
    accounts.global
  );

  vaultAcct = await vault.getAccount();
  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPost = vaultAcct.debt.toNumber();
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
  let vaultAcct: IdlAccounts<StablePool>["vault"] = await vault.getAccount();
  const ataUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPre = vaultAcct.debt.toNumber();

  assert(
    repayAmount == 0,
    "Test requires repay amount == 0 Repay Amount: " + repayAmount
  );

  await expect(
    repayUsdxCall(
      // borrow/mint amount
      repayAmount * LAMPORTS_PER_SOL,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // user token
      user.tokens.lpSaber,
      // mintUsdx MintAcct
      accounts.usdx,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // vault
      user.tokens.lpSaber.vault,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith("6015"); // InvalidTransferAmount

  vaultAcct = await vault.getAccount();
  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const vaultDebtPost = vaultAcct.debt.toNumber();
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
  const vaultInfo: web3.AccountInfo<Buffer> =
    await otherUserVault.getAccountInfo();
  assert(vaultInfo, "Test requires vault to already be created");

  const userUsdx = user.tokens.usdx;
  let vaultAcct: IdlAccounts<StablePool>["vault"] =
    await otherUserVault.getAccount();
  const userAtaUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const otherUserVaultDebtPre = vaultAcct.debt.toNumber();

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
      // borrow/mint amount
      repayAmountPrecise,
      // user connection
      user.provider.connection,
      // user wallet
      user.wallet,
      // user token
      user.tokens.lpSaber,
      // mintUsdx MintAcct
      accounts.usdx,
      // pool
      accounts.lpSaberUsdcUsdt.pool,
      // vault
      otherUser.tokens.lpSaber.vault,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith("2003"); // Raw Constraint Violated

  vaultAcct = await otherUserVault.getAccount();
  const userAtaUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const otherUserVaultDebtPost = vaultAcct.debt.toNumber();
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
