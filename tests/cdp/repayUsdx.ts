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
import { DECIMALS_USDX } from "../utils/constants";
import { handleTxn } from "../utils/fxns";
import {
  GlobalStateAcct,
  MintAcct,
  Pool,
  Trove, // TODO: trove -> vault
  User,
  UserToken,
} from "../utils/interfaces";

const programStablePool = workspace.StablePool as Program<StablePool>;

const repayUsdxCall = async (
  repayAmount: number,
  userConnection: Connection,
  userWallet: Wallet,
  userToken: UserToken,
  mintUsdx: MintAcct,
  pool: Pool,
  trove: Trove, // TODO: trove -> vault
  globalState: GlobalStateAcct
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.repayUsdx(new BN(repayAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        trove: trove.pubKey, // TODO: trove -> vault
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
  trove: Trove, // TODO: trove -> vault
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

  // get user trove info
  const troveInfo: web3.AccountInfo<Buffer> = await trove.getAccountInfo();
  assert(troveInfo, "Test requires trove to already be created");

  const userUsdx = user.tokens.usdx;
  let troveAcct: IdlAccounts<StablePool>["trove"] = await trove.getAccount();
  const ataUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const troveDebtPre = troveAcct.debt.toNumber();

  assert(
    repayAmountPrecise >= troveDebtPre,
    "Test requires repay amount >= trove balance. Please increase repay amount." +
      "Repay Amount: " +
      repayAmountPrecise +
      " Trove Balance :" +
      troveDebtPre
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
      // trove
      user.tokens.lpSaber.trove,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith("6019"); // RepayingMoreThanBorrowed

  troveAcct = await trove.getAccount();
  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const troveDebtPost = troveAcct.debt.toNumber();
  const ataDiff = ataUsdxBalPost - ataUsdxBalPre;
  const troveDiff = troveDebtPost - troveDebtPre;

  assert(
    ataDiff == 0,
    "Repay rejected but ata balance changed. ATA Diff: " + ataDiff
  );
  assert(
    troveDiff == 0,
    "Repay rejected but trove debt changed. Trove Diff: " + troveDiff
  );
};

export const repayUsdxPASS_RepayFullAmountBorrowed = async (
  user: User,
  trove: Trove,
  accounts: Accounts
) => {
  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user trove info
  const troveInfo: web3.AccountInfo<Buffer> = await trove.getAccountInfo();
  assert(troveInfo, "Test requires trove to already be created");

  const userUsdx = user.tokens.usdx;
  let troveAcct: IdlAccounts<StablePool>["trove"] = await trove.getAccount();
  const ataUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const troveDebtPre = troveAcct.debt.toNumber();
  const repayAmountPrecise = ataUsdxBalPre;

  assert(
    ataUsdxBalPre == troveDebtPre,
    "Test requires ataUsdxBal == troveDebt. Please make these values equal." +
      "ATA Usdx Bal: " +
      ataUsdxBalPre +
      " Trove Balance :" +
      troveDebtPre
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
    // trove
    user.tokens.lpSaber.trove,
    // globalState
    accounts.global
  );

  troveAcct = await trove.getAccount();
  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const troveDebtPost = troveAcct.debt.toNumber();

  assert(
    ataUsdxBalPost == 0,
    "ATA Bal not what expected" +
      "ATA Bal: " +
      ataUsdxBalPost +
      " Expected Bal: 0"
  );
  assert(
    troveDebtPost == 0,
    "Trove Debt not what expected" +
      "Trove Debt: " +
      troveDebtPost +
      " Expected Debt: 0"
  );
};

export const repayUsdxPASS_RepayLessThanBorrowed = async (
  user: User,
  trove: Trove,
  accounts: Accounts
) => {
  // get global state info
  const globalStateAccttInfo: web3.AccountInfo<Buffer> =
    await accounts.global.getAccountInfo();
  assert(
    globalStateAccttInfo,
    "Test requires global state to already be created"
  );

  // get user trove info
  const troveInfo: web3.AccountInfo<Buffer> = await trove.getAccountInfo();
  assert(troveInfo, "Test requires trove to already be created");

  const userUsdx = user.tokens.usdx;
  let troveAcct: IdlAccounts<StablePool>["trove"] = await trove.getAccount();
  const ataUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const troveDebtPre = troveAcct.debt.toNumber();

  const repayAmount = 1;

  assert(
    repayAmount <= troveDebtPre,
    "Test requires repay amount <= trove balance. Please decrease repay amount." +
      "Repay Amount: " +
      repayAmount +
      " Trove Balance :" +
      troveDebtPre
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
    // trove
    user.tokens.lpSaber.trove,
    // globalState
    accounts.global
  );

  troveAcct = await trove.getAccount();
  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const troveDebtPost = troveAcct.debt.toNumber();
  const ataDiff = ataUsdxBalPost - ataUsdxBalPre;
  const troveDiff = troveDebtPost - troveDebtPre;

  assert(
    ataDiff == -repayAmount,
    "ATA diff not what expected" +
      "ATA Diff: " +
      ataDiff +
      "Expected Diff: " +
      -repayAmount
  );
  assert(
    troveDiff == -repayAmount,
    "Trove diff not what expected" +
      "Trove Diff: " +
      troveDiff +
      "Expected Diff: " +
      -repayAmount
  );
};

export const repayUsdxFAIL_ZeroUsdx = async (
  user: User,
  trove: Trove,
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

  // get user trove info
  const troveInfo: web3.AccountInfo<Buffer> = await trove.getAccountInfo();
  assert(troveInfo, "Test requires trove to already be created");

  const userUsdx = user.tokens.usdx;
  let troveAcct: IdlAccounts<StablePool>["trove"] = await trove.getAccount();
  const ataUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const troveDebtPre = troveAcct.debt.toNumber();

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
      // trove
      user.tokens.lpSaber.trove,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith("6015"); // InvalidTransferAmount

  troveAcct = await trove.getAccount();
  const ataUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const troveDebtPost = troveAcct.debt.toNumber();
  const ataDiff = ataUsdxBalPost - ataUsdxBalPre;
  const troveDiff = troveDebtPost - troveDebtPre;

  assert(
    ataDiff == 0,
    "Repay rejected but ata balance changed. ATA Diff: " + ataDiff
  );
  assert(
    troveDiff == 0,
    "Repay rejected but trove debt changed. Trove Diff: " + troveDiff
  );
};

export const repayUsdxFAIL_RepayAnotherUsersDebt = async (
  user: User,
  otherUser: User,
  otherUserTrove: Trove, // TODO: trove -> vault
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

  // get user trove info
  const troveInfo: web3.AccountInfo<Buffer> =
    await otherUserTrove.getAccountInfo();
  assert(troveInfo, "Test requires trove to already be created");

  const userUsdx = user.tokens.usdx;
  let troveAcct: IdlAccounts<StablePool>["trove"] =
    await otherUserTrove.getAccount();
  const userAtaUsdxBalPre = (await userUsdx.ata.getBalance()).value.uiAmount;
  const otherUserTroveDebtPre = troveAcct.debt.toNumber();

  assert(
    repayAmountPrecise <= userAtaUsdxBalPre,
    "Test requires repayAmount <= User Usdx Balance." +
      "User Usdx Balance: " +
      userAtaUsdxBalPre +
      " Repay Amount: " +
      repayAmountPrecise
  );
  assert(
    repayAmountPrecise <= otherUserTroveDebtPre,
    "Test requires repayAmount <= Other User Trove Debt." +
      "Repay Amount: " +
      repayAmountPrecise +
      " Other User Trove Debt: " +
      otherUserTroveDebtPre
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
      // trove
      otherUser.tokens.lpSaber.trove,
      // globalState
      accounts.global
    )
  ).to.be.rejectedWith("2003"); // Raw Constraint Violated

  troveAcct = await otherUserTrove.getAccount();
  const userAtaUsdxBalPost = (await userUsdx.ata.getBalance()).value.uiAmount;
  const otherUserTroveDebtPost = troveAcct.debt.toNumber();
  const ataDiff = userAtaUsdxBalPost - userAtaUsdxBalPre;
  const troveDiff = otherUserTroveDebtPost - otherUserTroveDebtPre;

  assert(
    ataDiff == 0,
    "Repay rejected but ata balance changed. ATA Diff: " + ataDiff
  );
  assert(
    troveDiff == 0,
    "Repay rejected but trove debt changed. Trove Diff: " + troveDiff
  );
};
