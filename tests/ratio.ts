// anchor/solana
import * as anchor from "@project-serum/anchor";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { use as chaiUse, assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
// local imports
import { StablePool } from "../target/types/stable_pool";
import * as constants from "./utils/constants";
import { initUsersObj, Users, usersObj } from "./config/users";
import { getGlobalStateVaultAndTrove } from "./utils/fxns";
import { Accounts, configAccountsObj } from "./config/accounts";

// init env
chaiUse(chaiAsPromised);
// constants
const programStablePool = anchor.workspace
  .StablePool as anchor.Program<StablePool>;
// init variables
let accounts: Accounts;
let users: Users;

describe("ratio", async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  before(async () => {
    accounts = await configAccountsObj(provider, usersObj);

    users = await initUsersObj(
      provider,
      accounts,
      usersObj,
      accounts.vaultLpSaber
    );

    // mint tokens
    users.base.ataLpSaber.pubKey = await accounts.mintLpSaber.createAccount(
      users.base.wallet.publicKey
    );
    console.log(
      "accounts.mintLpSaber =",
      accounts.mintLpSaber.publicKey.toBase58()
    );
    console.log(
      "users.base.ataLpSaber.pubKey =",
      users.base.ataLpSaber.pubKey.toBase58()
    );
    await accounts.mintLpSaber.mintTo(
      users.base.ataLpSaber.pubKey,
      users.super.wallet.payer,
      [],
      200_000_000 /* 0.2 LPT */
    );
  });

  const depositAmount = 100_000_000; // 0.1 LPT
  const tvlLimit = 1_000_000_000;
  const globalDebtCeiling = 15_000_000;
  const vaultDebtCeiling = 10_000_000;
  const userDebtCeiling = 0;
  const USD_DECIMAL = 6;

  console.log(
    "users .super.wallet.payer =",
    users.super.wallet.publicKey.toBase58()
  );
  console.log("user =", users.base.wallet.publicKey.toBase58());

  it("Create Global State", async () => {
    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    let txn1 = await programStablePool.rpc.createGlobalState(
      accounts.global.bump,
      accounts.mintUsd.bump,
      new anchor.BN(tvlLimit),
      new anchor.BN(globalDebtCeiling),
      {
        accounts: {
          authority: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
          mintUsd: accounts.mintUsd.pubKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn1.globalState.authority.toBase58() ==
        users.super.wallet.publicKey.toBase58()
    );
    assert(
      afterTxn1.globalState.mintUsd.toBase58() ==
        accounts.mintUsd.pubKey.toBase58()
    );
    assert(
      afterTxn1.globalState.tvlLimit.toNumber() == tvlLimit,
      "GlobalState TVL Limit: " +
        afterTxn1.globalState.tvlLimit +
        " TVL Limit: " +
        tvlLimit
    );
    assert(afterTxn1.globalState.tvl.toNumber() == 0);
    assert(afterTxn1.globalState.totalDebt.toNumber() == 0);
    assert(
      afterTxn1.globalState.debtCeiling.toNumber() == globalDebtCeiling,
      "GlobalState Debt Ceiling: " +
        afterTxn1.globalState.debtCeiling +
        " Debt Ceiling: " +
        globalDebtCeiling
    );
  });

  it("Only the super owner can create token vaults", async () => {
    const riskLevel = 0;
    const isDual = 0;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    // const beforeTxn1 = await getGlobalStateVaultAndTrove(accounts, users.base, accounts.vaultLpSaber);
    const createVaultCall = async () => {
      await programStablePool.rpc.createVault(
        accounts.vaultLpSaber.bump,
        new anchor.BN(riskLevel),
        new anchor.BN(isDual),
        new anchor.BN(constants.VAULT_DEBT_CEILING),
        constants.PLATFORM_TYPE_SABER,
        {
          accounts: {
            authority: users.base.wallet.publicKey,
            vault: accounts.vaultLpSaber.pubKey,
            globalState: accounts.global.pubKey,
            mintColl: accounts.mintLpSaber.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [users.base.wallet.payer],
        }
      );
    };
    // const afterTxn1 = await getGlobalStateVaultAndTrove(accounts, users.base, accounts.vaultLpSaber);

    await assert.isRejected(
      createVaultCall(),
      /A raw constraint was violated/,
      "No error was thrown when trying to create a vault with a user different than the super owner"
    );

    await assert.isRejected(
      programStablePool.account.vault.fetch(accounts.vaultLpSaber.pubKey),
      /Account does not exist /,
      "Fetching a vault that shouldn't had been created did not throw an error"
    );
  });

  it("Only the super owner can create token vaults", async () => {
    const riskLevel = 0;
    const isDual = 0;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    // const beforeTxn1 = await getGlobalStateVaultAndTrove(accounts, users.base, accounts.vaultLpSaber);
    const createVaultCall = async () => {
      await programStablePool.rpc.createVault(
        accounts.vaultLpSaber.bump,
        new anchor.BN(riskLevel),
        new anchor.BN(isDual),
        new anchor.BN(constants.VAULT_DEBT_CEILING),
        constants.PLATFORM_TYPE_SABER,
        {
          accounts: {
            authority: users.base.wallet.publicKey,
            vault: accounts.vaultLpSaber.pubKey,
            globalState: accounts.global.pubKey,
            mintColl: accounts.mintLpSaber.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [users.base.wallet.payer],
        }
      );
    };
    // const afterTxn1 = await getGlobalStateVaultAndTrove(accounts, users.base, accounts.vaultLpSaber);

    await assert.isRejected(
      createVaultCall(),
      /A raw constraint was violated/,
      "No error was thrown when trying to create a vault with a user different than the super owner"
    );

    await assert.isRejected(
      programStablePool.account.vault.fetch(accounts.vaultLpSaber.pubKey),
      /Account does not exist /,
      "Fetching a vault that shouldn't had been created did not throw an error"
    );
  });

  it("Create Token Vault", async () => {
    console.log("vault pubKey", accounts.vaultLpSaber.pubKey.toBase58());
    const riskLevel = 0;
    const isDual = 0;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.createVault(
      accounts.vaultLpSaber.bump,
      new anchor.BN(riskLevel),
      new anchor.BN(isDual),
      new anchor.BN(constants.VAULT_DEBT_CEILING),
      constants.PLATFORM_TYPE_SABER,
      {
        accounts: {
          authority: users.super.wallet.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          globalState: accounts.global.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    console.log("txHash =", txn1);
    assert(
      afterTxn1.vault.mintColl.toBase58() ==
        accounts.mintLpSaber.publicKey.toBase58(),
      "mintColl mismatch"
    );
    assert(afterTxn1.vault.totalColl.toNumber() == 0, "totalColl mismatch");
    assert(afterTxn1.vault.totalDebt.toNumber() == 0, "totalDebt mismatch");
    assert(
      afterTxn1.vault.debtCeiling.toNumber() == vaultDebtCeiling,
      "Vault Debt Ceiling: " +
        afterTxn1.vault.debtCeiling +
        " Debt Ceiling: " +
        globalDebtCeiling
    );
    assert(afterTxn1.vault.riskLevel == riskLevel, "riskLevel mismatch");
  });

  it("Create Token Vault fails if globalState is not created", async () => {
    console.log("Checking if global state exists");
    await assert.isRejected(
      programStablePool.account.globalState.fetch(accounts.global.pubKey),
      /Account does not exist /,
      "The global state exists"
    );

    const riskLevel = 0;
    const isDual = 0;
    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    // const beforeTxn1 = await getGlobalStateVaultAndTrove(accounts, users.base, accounts.vaultLpSaber);
    const createVaultCall = async () => {
      console.log("Calling createVault");
      await programStablePool.rpc.createVault(
        accounts.vaultLpSaber.bump,
        new anchor.BN(riskLevel),
        new anchor.BN(isDual),
        new anchor.BN(constants.VAULT_DEBT_CEILING),
        constants.PLATFORM_TYPE_SABER,
        {
          accounts: {
            authority: users.base.wallet.publicKey,
            vault: accounts.vaultLpSaber.pubKey,
            globalState: accounts.global.pubKey,
            mintColl: accounts.mintLpSaber.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [users.base.wallet.payer],
        }
      );
    };
    // const afterTxn1 = await getGlobalStateVaultAndTrove(accounts, users.base, accounts.vaultLpSaber);

    await expect(
      createVaultCall(),
      "No error was thrown when trying to create a vault without a global state created"
    ).is.rejected;

    console.log("Confirming vault was not created");
    await assert.isRejected(
      programStablePool.account.vault.fetch(accounts.vaultLpSaber.pubKey),
      /Account does not exist /,
      "Fetching a vault that shouldn't had been created did not throw an error"
    );
  });

  it("Create User Trove", async () => {
    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.createTrove(
      users.base.troveLpSaber.bump,
      accounts.vaultLpSaber.bump,
      new anchor.BN(0),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn1.trove.lockedCollBalance.toNumber() == 0,
      "lockedCollBalance mismatch"
    );
    assert(afterTxn1.trove.debt.toNumber() == 0, "debt mismatch");
  });

  it("Deposit Collateral", async () => {
    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.depositCollateral(
      new anchor.BN(depositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn1.trove.lockedCollBalance.toNumber() == depositAmount,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn1.trove.lockedCollBalance
    );
    assert(
      afterTxn1.vault.totalColl.toNumber() == depositAmount,
      "depositAmount mismatch: totalColl = " + afterTxn1.vault.totalColl
    );
    assert(
      afterTxn1.globalState.tvl.toNumber() == depositAmount,
      "tvl mistmatch: tvl = " + afterTxn1.globalState.tvl
    );

    // trying fxn out here
    // let poolLpTokenAccountAmt = (
    //   await getAcctBalance(provider, accounts.vaultLpSaber.pubKey)
    // ).amount.toString();
    let userLpTokenAccountAmt = (
      await accounts.mintLpSaber.getAccountInfo(users.base.ataLpSaber.pubKey)
    ).amount.toString();

    // console.log("poolLpTokenAccount.amount =", poolLpTokenAccountAmt);
    console.log("userLpTokenAccount.amount =", userLpTokenAccountAmt);
  });

  it("Borrow USD", async () => {
    let amount = 10_000_000; // 10 USDx

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.borrowUsd(
      new anchor.BN(amount),
      users.base.usd.bump,
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
          priceFeed: null as PublicKey, // incorrect but here as placeholder
          globalState: accounts.global.pubKey,
          mintUsd: accounts.mintUsd.pubKey,
          ataUserUsd: users.base.usd.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    console.log(
      "vaultAfterTxn.total_debt =",
      afterTxn1.vault.totalDebt.toString()
    );
    assert(
      afterTxn1.vault.totalDebt.toNumber() == amount,
      "Vault Total Debt: " +
        afterTxn1.vault.totalDebt +
        "Expected Debt: " +
        amount
    );
    assert(
      afterTxn1.vault.totalDebt <= afterTxn1.vault.debtCeiling,
      "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional"
    );
    console.log("trove.debt =", afterTxn1.trove.debt.toString());
    console.log("trove.lastMintTime =", afterTxn1.trove.lastMintTime);
    assert(
      afterTxn1.trove.debt.toNumber() == amount,
      "User Trove Debt: " + afterTxn1.trove.debt + "Expected Debt: " + amount
    );
    assert(
      afterTxn1.globalState.totalDebt.toNumber() == amount,
      "Global Total Debt: " +
        afterTxn1.vault.totalDebt +
        "Expected Debt: " +
        amount
    );
    assert(
      afterTxn1.globalState.totalDebt <= afterTxn1.globalState.debtCeiling,
      "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional"
    );
  });

  it("Repay USD", async () => {
    let amount = 10_000_000; // 10 USDx
    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.repayUsd(new anchor.BN(amount), {
      accounts: {
        owner: users.base.wallet.publicKey,
        vault: accounts.vaultLpSaber.pubKey,
        trove: users.base.troveLpSaber.pubKey,
        globalState: accounts.global.pubKey,
        mintUsd: accounts.mintUsd.pubKey,
        ataUserUsd: users.base.usd.pubKey,
        mintColl: accounts.mintLpSaber.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [users.base.wallet.payer],
    });
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn1.trove.debt.toNumber() == 0,
      "User Trove Debt: " + afterTxn1.trove.debt + "Expected Debt: " + 0
    );
    assert(
      afterTxn1.vault.totalDebt <= afterTxn1.vault.debtCeiling,
      "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional"
    );
    assert(
      afterTxn1.vault.totalDebt.toNumber() == 0,
      "Vault Total Debt: " + afterTxn1.vault.totalDebt + " Expected Debt: " + 0
    );
    assert(
      afterTxn1.globalState.totalDebt.toNumber() == 0,
      "Global Total Debt: " + afterTxn1.vault.totalDebt + "Expected Debt: " + 0
    );
    assert(
      afterTxn1.globalState.totalDebt < afterTxn1.globalState.debtCeiling,
      "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional"
    );
  });

  it("Withdraw Collateral", async () => {
    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.withdrawCollateral(
      new anchor.BN(depositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );

    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    assert(
      afterTxn1.vault.totalColl.toNumber() == 0,
      "depositAmount mismatch: totalColl = " + afterTxn1.vault.totalColl
    );
    assert(
      afterTxn1.trove.lockedCollBalance.toNumber() == 0,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn1.trove.lockedCollBalance
    );
    assert(
      afterTxn1.globalState.tvl.toNumber() == 0,
      "tvl mistmatch: tvl = " + afterTxn1.globalState.tvl
    );

    let poolLpTokenAccount = await accounts.mintLpSaber.getAccountInfo(
      accounts.vaultLpSaber.pubKey
    );
    let userLpTokenAccount = await accounts.mintLpSaber.getAccountInfo(
      users.base.ataLpSaber.pubKey
    );
    const poolAmtStr = poolLpTokenAccount.amount.toString();
    console.log("poolAmt =", poolAmtStr.toString());
    const userAmtStr = userLpTokenAccount.amount.toString();
    console.log("userAmtStr =", userAmtStr.toString());
  });

  it("Set Global TVL Limit", async () => {
    const newTVLLimit = 5_000_000;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.setGlobalTvlLimit(
      new anchor.BN(newTVLLimit),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn1.globalState.tvlLimit.toNumber() == newTVLLimit,
      "Global Debt Ceiling: " +
        afterTxn1.globalState.tvlLimit.toNumber() +
        " Expected Debt Ceiling: " +
        newTVLLimit
    );

    // TXN 2: Reverting to original global tvl limit
    const beforeTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn2 = await programStablePool.rpc.setGlobalTvlLimit(
      new anchor.BN(tvlLimit),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn2.globalState.tvlLimit.toNumber() == tvlLimit,
      "Global Debt Ceiling: " +
        afterTxn2.globalState.tvlLimit.toNumber() +
        " Expected Debt Ceiling: " +
        tvlLimit
    );
  });

  it("Set Global Debt Ceiling", async () => {
    const newGlobalDebtCeiling = 5_000_000;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.setGlobalDebtCeiling(
      new anchor.BN(newGlobalDebtCeiling),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn1.globalState.debtCeiling.toNumber() == newGlobalDebtCeiling,
      "Global Debt Ceiling: " +
        afterTxn1.globalState.debtCeiling.toNumber() +
        " Expected Debt Ceiling: " +
        newGlobalDebtCeiling
    );

    // TXN 2: Reverting to original global debt ceiling
    const beforeTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn2 = await programStablePool.rpc.setGlobalDebtCeiling(
      new anchor.BN(globalDebtCeiling),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn2.globalState.debtCeiling.toNumber() == globalDebtCeiling,
      "Global Debt Ceiling: " +
        afterTxn2.globalState.debtCeiling.toNumber() +
        " Expected Debt Ceiling: " +
        globalDebtCeiling
    );
  });

  it("Set Vault Debt Ceiling", async () => {
    const newVaultDebtCeiling = 5_000_000;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.setVaultDebtCeiling(
      new anchor.BN(newVaultDebtCeiling),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    assert(
      afterTxn1.vault.debtCeiling.toNumber() == newVaultDebtCeiling,
      "Vault Debt Ceiling: " +
        afterTxn1.vault.debtCeiling.toNumber() +
        " Expected Debt Ceiling: " +
        newVaultDebtCeiling
    );

    // TXN 2: Reverting to original vault debt ceiling
    const beforeTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn2 = await programStablePool.rpc.setVaultDebtCeiling(
      new anchor.BN(vaultDebtCeiling),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn2.vault.debtCeiling.toNumber() == vaultDebtCeiling,
      "Vault Debt Ceiling: " +
        afterTxn2.vault.debtCeiling.toNumber() +
        " Expected Debt Ceiling: " +
        vaultDebtCeiling
    );
  });

  it("Set User Debt Ceiling", async () => {
    const newUserDebtCeiling = 5_000_000;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.setUserDebtCeiling(
      new anchor.BN(newUserDebtCeiling),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          user: users.base.wallet.publicKey,
          globalState: accounts.global.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    assert(
      afterTxn1.trove.debtCeiling.toNumber() == newUserDebtCeiling,
      "Vault Debt Ceiling: " +
        afterTxn1.trove.debtCeiling.toNumber() +
        " Expected Debt Ceiling: " +
        newUserDebtCeiling
    );

    // TXN 2: Reverting to original vault debt ceiling
    const beforeTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn2 = await programStablePool.rpc.setUserDebtCeiling(
      new anchor.BN(userDebtCeiling),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          user: users.base.wallet.publicKey,
          globalState: accounts.global.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn2.trove.debtCeiling.toNumber() == userDebtCeiling,
      "User Debt Ceiling: " +
        afterTxn2.trove.debtCeiling.toNumber() +
        " Expected Debt Ceiling: " +
        userDebtCeiling
    );
  });

  it("Set Global TVL Limit Fails If Not Called By Super Owner", async () => {
    const newTVLLimit = 5_000_000;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const callSetGlobalTvlLimit = async () => {
      await programStablePool.rpc.setGlobalTvlLimit(
        new anchor.BN(newTVLLimit),
        {
          accounts: {
            payer: users.base.wallet.publicKey,
            globalState: accounts.global.pubKey,
          },
          signers: [users.base.wallet.payer],
        }
      );
    };
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    await expect(
      callSetGlobalTvlLimit(),
      "No error was thrown when trying to set the global tvl limit from non super owner acount"
    ).is.rejected;
    assert(
      afterTxn1.globalState.tvlLimit.toNumber() == tvlLimit,
      "Global Debt Ceiling: " +
        afterTxn1.globalState.tvlLimit.toNumber() +
        " Expected Global Debt Ceiling: " +
        tvlLimit
    );
  });

  it("Set Global Debt Ceiling Fails If Not Called By Super Owner", async () => {
    const newGlobalDebtCeiling = 5_000_000;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const callSetGlobalDebtCeiling = async () => {
      await programStablePool.rpc.setGlobalDebtCeiling(
        new anchor.BN(newGlobalDebtCeiling),
        {
          accounts: {
            payer: users.base.wallet.publicKey,
            globalState: accounts.global.pubKey,
          },
          signers: [users.base.wallet.payer],
        }
      );
    };
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    await expect(
      callSetGlobalDebtCeiling(),
      "No error was thrown when trying to set the global debt ceiling from non super owner acount"
    ).is.rejected;

    assert(
      afterTxn1.globalState.debtCeiling.toNumber() == globalDebtCeiling,
      "Global Debt Ceiling: " +
        afterTxn1.globalState.debtCeiling.toNumber() +
        " Expected Global Debt Ceiling: " +
        globalDebtCeiling
    );
  });

  it("Set Vault Debt Ceiling Fails If Not Called By Super Owner", async () => {
    const newVaultDebtCeiling = 5_000_000;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const callSetVaultDebtCeiling = async () => {
      await programStablePool.rpc.setVaultDebtCeiling(
        new anchor.BN(newVaultDebtCeiling),
        {
          accounts: {
            payer: users.base.wallet.publicKey,
            globalState: accounts.global.pubKey,
            mintColl: accounts.mintLpSaber.publicKey,
            vault: accounts.vaultLpSaber.pubKey,
          },
          signers: [users.base.wallet.payer],
        }
      );
    };
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    await expect(
      callSetVaultDebtCeiling(),
      "No error was thrown when trying to set the vault debt ceiling from non super owner acount"
    ).is.rejected;

    assert(
      afterTxn1.vault.debtCeiling.toNumber() == vaultDebtCeiling,
      "Vault Debt Ceiling: " +
        afterTxn1.vault.debtCeiling.toNumber() +
        " Expected Global Debt Ceiling: " +
        vaultDebtCeiling
    );
  });

  it("Set User Debt Ceiling Fails If Not Called By Super Owner", async () => {
    const newUserDebtCeiling = 5_000_000;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const callSetUserDebtCeiling = async () => {
      await programStablePool.rpc.setUserDebtCeiling(
        new anchor.BN(newUserDebtCeiling),
        {
          accounts: {
            payer: users.base.wallet.publicKey,
            user: users.base.wallet.publicKey,
            globalState: accounts.global.pubKey,
            mintColl: accounts.mintLpSaber.publicKey,
            vault: accounts.vaultLpSaber.pubKey,
            trove: users.base.troveLpSaber.pubKey,
          },
          signers: [users.base.wallet.payer],
        }
      );
    };
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    await expect(
      callSetUserDebtCeiling(),
      "No error was thrown when trying to set the user debt ceiling from non super owner acount"
    ).is.rejected;

    assert(
      afterTxn1.trove.debtCeiling.toNumber() == userDebtCeiling,
      "User Debt Ceiling: " +
        afterTxn1.trove.debtCeiling.toNumber() +
        " Expected Debt Ceiling: " +
        userDebtCeiling
    );
  });

  it("TVL Limit", async () => {
    const amount = 2_000_000_000;

    await accounts.mintLpSaber.mintTo(
      users.base.ataLpSaber.pubKey,
      users.super.wallet.payer,
      [],
      2_000_000_000 /* 2 LPT */
    );

    const globalStatePre = await programStablePool.account.globalState.fetch(
      accounts.global.pubKey
    );
    console.log("fetched globalState", globalStatePre);

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const depositCollateralTxn = async () => {
      await programStablePool.rpc.depositCollateral(new anchor.BN(amount), {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      });
    };
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    console.log("Confirming deposit was rejected due to exceeding tvl");
    await expect(
      depositCollateralTxn(),
      "No error was thrown when trying deposit an amount above the tvl"
    ).is.rejected;

    assert(
      afterTxn1.vault.totalColl.toNumber() == 0,
      "depositAmount mismatch: totalColl = " + afterTxn1.vault.totalColl
    );
    assert(
      afterTxn1.trove.lockedCollBalance.toNumber() == 0,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn1.trove.lockedCollBalance
    );
    assert(
      afterTxn1.globalState.tvl.toNumber() == 0,
      "tvl mistmatch: tvl = " + afterTxn1.globalState.tvl
    );
  });

  it("User can't borrow if vault debt ceiling is exceeded", async () => {
    const userDepositAmount = 100_000_000;
    const userBorrowAmount = 9_000_000;
    const localUserDepositAmount = 100_000_000;
    const localUserBorrowAmount = 2_000_000;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn = await programStablePool.rpc.depositCollateral(
      new anchor.BN(userDepositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn1.vault.totalColl.toNumber() == userDepositAmount,
      "depositAmount mismatch: totalColl = " + afterTxn1.vault.totalColl
    );
    assert(
      afterTxn1.trove.lockedCollBalance.toNumber() == userDepositAmount,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn1.trove.lockedCollBalance
    );
    assert(
      afterTxn1.globalState.tvl.toNumber() == userDepositAmount,
      "tvl mistmatch: tvl = " + afterTxn1.globalState.tvl
    );

    // TXN 2
    const beforeTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    let txn2 = await programStablePool.rpc.borrowUsd(
      new anchor.BN(userBorrowAmount),
      users.base.usd.bump,
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
          globalState: accounts.global.pubKey,
          priceFeed: null as PublicKey, // incorrect but here as placeholder
          mintUsd: accounts.mintUsd.pubKey,
          ataUserUsd: users.base.usd.pubKey, // prev: userUsdKey
          mintColl: accounts.mintLpSaber.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn2.vault.totalDebt.toNumber() == userBorrowAmount,
      "Vault Total Debt: " +
        afterTxn2.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn2.vault.totalDebt.lt(afterTxn2.vault.debtCeiling),
      "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional"
    );
    assert(
      afterTxn2.globalState.totalDebt.toNumber() == userBorrowAmount,
      "Global Total Debt: " +
        afterTxn2.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn2.globalState.totalDebt.lt(afterTxn2.globalState.debtCeiling),
      "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional"
    );
    assert(
      afterTxn2.trove.debt.toNumber() == userBorrowAmount,
      "User Trove Debt: " +
        afterTxn2.trove.debt +
        " Expected Debt: " +
        userBorrowAmount
    );

    // airdrop for some reason?
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        users.base.wallet.publicKey,
        1000000000
      ),
      "confirmed"
    );

    await accounts.mintLpSaber.mintTo(
      users.base.ataLpSaber.pubKey,
      users.super.wallet.payer,
      [],
      200_000_000 /* 0.2 LPT */
    );

    // TXN 3
    const beforeTxn3 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn3 = await programStablePool.rpc.createTrove(
      users.base.troveLpSaber.bump,
      users.base.ataTroveLpSaber.bump,
      new anchor.BN(userDebtCeiling),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn3 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn3.trove.lockedCollBalance.toNumber() == 0,
      "lockedCollBalance mismatch"
    );
    assert(afterTxn3.trove.debt.toNumber() == 0, "debt mismatch");

    // TXN 4: Deposit and attempt to borrow, should fail
    const beforeTxn4 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn4 = await programStablePool.rpc.depositCollateral(
      new anchor.BN(localUserDepositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn4 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    console.log("localUserDepositAmount =", localUserDepositAmount);
    assert(
      afterTxn4.vault.totalColl.toNumber() ==
        userDepositAmount + localUserDepositAmount,
      "depositAmount mismatch: totalColl = " + afterTxn4.vault.totalColl
    );
    console.log("tvl = ", afterTxn4.globalState.tvl);
    assert(
      afterTxn4.globalState.tvl.toNumber() ==
        userDepositAmount + localUserDepositAmount,
      "tvl mistmatch: tvl = " + afterTxn4.globalState.tvl
    );
    assert(
      afterTxn4.trove.lockedCollBalance.toNumber() == localUserDepositAmount,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn4.trove.lockedCollBalance
    );

    // TXN 5
    const beforeTxn5 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const borrowUsd = async () => {
      await programStablePool.rpc.borrowUsd(
        new anchor.BN(localUserBorrowAmount),
        users.base.usd.bump,
        {
          accounts: {
            authority: users.base.wallet.publicKey,
            vault: accounts.vaultLpSaber.pubKey,
            trove: users.base.troveLpSaber,
            globalState: accounts.global.pubKey,
            priceFeed: null as PublicKey, // incorrect but here as placeholder
            mintUsd: accounts.mintUsd.pubKey,
            ataUserUsd: users.base.usd.pubKey,
            mintColl: accounts.mintLpSaber.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
          signers: [users.base.wallet.payer],
        }
      );
    };
    const afterTxn5 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    await expect(
      borrowUsd(),
      "No error was thrown when trying borrow an amount above debt ceiling"
    ).is.rejected;
    assert(
      afterTxn5.trove.debt.toNumber() == userBorrowAmount,
      "User Trove Debt: " +
        afterTxn5.trove.debt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn5.trove.debt.toNumber() == 0,
      "User Trove Debt: " + afterTxn5.trove.debt + " Expected Debt: " + 0
    );
    assert(
      afterTxn5.vault.totalDebt.lt(afterTxn5.vault.debtCeiling),
      "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional\n vault.totalDebt = " +
        afterTxn5.vault.totalDebt +
        " vault.debtCeiling = " +
        afterTxn5.vault.debtCeiling
    );
    assert(
      afterTxn5.vault.totalDebt.toNumber() == userBorrowAmount,
      "Vault Total Debt: " +
        afterTxn5.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn5.globalState.totalDebt.toNumber() == userBorrowAmount,
      "Global Total Debt: " +
        afterTxn5.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn5.globalState.totalDebt.lt(afterTxn5.globalState.debtCeiling),
      "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional"
    );

    // TXN 6: Clean up (repay debt, withdraw deposits)
    const beforeTxn6 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn6 = await programStablePool.rpc.repayUsd(
      new anchor.BN(userDepositAmount),
      {
        accounts: {
          owner: users.base.wallet.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
          globalState: accounts.global.pubKey,
          mintUsd: accounts.mintUsd.pubKey,
          ataUserUsd: users.base.usd.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn6 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn6.vault.totalDebt.lt(afterTxn6.vault.debtCeiling),
      "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional"
    );
    assert(
      afterTxn6.vault.totalDebt.toNumber() == 0,
      "Vault Total Debt: " + afterTxn6.vault.totalDebt + " Expected Debt: " + 0
    );
    assert(
      afterTxn6.globalState.totalDebt.toNumber() == 0,
      "Global Total Debt: " + afterTxn6.vault.totalDebt + " Expected Debt: " + 0
    );
    assert(
      afterTxn6.globalState.totalDebt.lt(afterTxn6.globalState.debtCeiling),
      "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional"
    );
    assert(
      afterTxn6.trove.debt.toNumber() == 0,
      "User Trove Debt: " + afterTxn6.trove.debt + " Expected Debt: " + 0
    );

    // TXN 7
    const beforeTxn7 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn7 = await programStablePool.rpc.withdrawCollateral(
      new anchor.BN(userDepositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn7 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    assert(
      afterTxn7.vault.totalColl.toNumber() == localUserDepositAmount,
      "depositAmount mismatch: totalColl = " + afterTxn7.vault.totalColl
    );
    assert(
      afterTxn7.globalState.tvl.toNumber() == localUserDepositAmount,
      "tvl mistmatch: tvl = " + afterTxn7.globalState.tvl
    );
    assert(
      afterTxn7.trove.lockedCollBalance.toNumber() == 0,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn7.trove.lockedCollBalance
    );

    // TXN 8
    const beforeTxn8 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn8 = await programStablePool.rpc.withdrawCollateral(
      new anchor.BN(localUserDepositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn8 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn8.vault.totalColl.toNumber() == 0,
      "depositAmount mismatch: totalColl = " + afterTxn8.vault.totalColl
    );
    assert(
      afterTxn8.globalState.tvl.toNumber() == 0,
      "tvl mistmatch: tvl = " + afterTxn8.globalState.tvl
    );
    assert(
      afterTxn8.trove.lockedCollBalance.toNumber() == 0,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn8.trove.lockedCollBalance
    );
  });

  it("User can't borrow if global debt ceiling is exceeded", async () => {
    let userDepositAmount = 100_000_000;
    let userBorrowAmount = 4_000_000;
    let localUserDepositAmount = 100_000_000;
    let localUserBorrowAmount = 2_000_000;
    let newGlobalDebtCeiling = 5_000_000;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.setGlobalDebtCeiling(
      new anchor.BN(newGlobalDebtCeiling),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn1.globalState.debtCeiling.toNumber() == newGlobalDebtCeiling,
      "Global Debt Ceiling: " +
        afterTxn1.globalState.debtCeiling.toNumber() +
        " Expected Debt Ceiling: " +
        newGlobalDebtCeiling
    );

    // TXN 2
    const beforeTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn2 = await programStablePool.rpc.depositCollateral(
      new anchor.BN(userDepositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn2.vault.totalColl.toNumber() == userDepositAmount,
      "depositAmount mismatch: totalColl = " + afterTxn2.vault.totalColl
    );
    assert(
      afterTxn2.trove.lockedCollBalance.toNumber() == userDepositAmount,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn2.trove.lockedCollBalance
    );
    assert(
      afterTxn2.globalState.tvl.toNumber() == userDepositAmount,
      "tvl mistmatch: tvl = " + afterTxn2.globalState.tvl
    );

    // TXN 3
    const beforeTxn3 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn3 = await programStablePool.rpc.borrowUsd(
      new anchor.BN(userBorrowAmount),
      users.base.usd.bump,
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
          priceFeed: null as PublicKey, // this is incorrect but here as a placeholder
          globalState: accounts.global.pubKey,
          mintUsd: accounts.mintUsd.pubKey,
          ataUserUsd: users.base.usd.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn3 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn3.vault.totalDebt.toNumber() == userBorrowAmount,
      "Vault Total Debt: " +
        afterTxn3.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );

    assert(
      afterTxn3.globalState.totalDebt.lt(afterTxn3.globalState.debtCeiling),
      "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional"
    );
    assert(
      afterTxn3.globalState.totalDebt.toNumber() == userBorrowAmount,
      "Global Total Debt: " +
        afterTxn3.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn3.vault.totalDebt.lt(afterTxn3.vault.debtCeiling),
      "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional"
    );
    assert(
      afterTxn3.trove.debt.toNumber() == userBorrowAmount,
      "User Trove Debt: " +
        afterTxn3.trove.debt +
        " Expected Debt: " +
        userBorrowAmount
    );

    // airdrop for some reason
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        users.base.wallet.publicKey,
        1000000000
      ),
      "confirmed"
    );
    // mint for some reason
    await accounts.mintLpSaber.mintTo(
      users.base.ataLpSaber.pubKey,
      users.super.wallet.payer,
      [],
      200_000_000 /* 0.2 LPT */
    );

    // TxN 4
    const beforeTxn4 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn4 = await programStablePool.rpc.createTrove(
      users.base.troveLpSaber.bump, //localUserTroveNonce -> userTroveNonce -> troveNonce
      users.base.ataTroveLpSaber.bump,
      new anchor.BN(userDebtCeiling),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey, // prev: localTokenCollKey
          vault: accounts.vaultLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn4 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn4.trove.lockedCollBalance.toNumber() == 0,
      "lockedCollBalance mismatch"
    );
    assert(afterTxn4.trove.debt.toNumber() == 0, "debt mismatch");

    // TXN 5: Deposit and attempt to borrow, should fail
    const beforeTxn5 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn5 = await programStablePool.rpc.depositCollateral(
      new anchor.BN(localUserDepositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn5 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    console.log("localUserDepositAmount =", localUserDepositAmount);
    assert(
      afterTxn5.vault.totalColl.toNumber() ==
        userDepositAmount + localUserDepositAmount,
      "depositAmount mismatch: totalColl = " + afterTxn5.vault.totalColl
    );
    console.log("tvl = ", afterTxn5.globalState.tvl);
    assert(
      afterTxn5.globalState.tvl.toNumber() ==
        userDepositAmount + localUserDepositAmount,
      "tvl mistmatch: tvl = " + afterTxn5.globalState.tvl
    );
    assert(
      afterTxn5.trove.lockedCollBalance.toNumber() == localUserDepositAmount,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn5.trove.lockedCollBalance
    );

    // TXN 6
    const beforeTxn6 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const borrowUsd = async () => {
      await programStablePool.rpc.borrowUsd(
        new anchor.BN(localUserBorrowAmount),
        users.base.usd.bump,
        {
          accounts: {
            authority: users.base.wallet.publicKey,
            vault: accounts.vaultLpSaber.pubKey,
            trove: users.base.troveLpSaber.pubKey,
            globalState: accounts.global.pubKey,
            priceFeed: null as PublicKey, // incorrect but here as placeholder
            mintUsd: accounts.mintUsd.pubKey,
            ataUserUsd: users.base.usd.pubKey,
            mintColl: accounts.mintLpSaber.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
          signers: [users.base.wallet.payer],
        }
      );
    };
    const afterTxn6 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    await expect(
      borrowUsd(),
      "No error was thrown when trying borrow an amount above global debt ceiling"
    ).is.rejected;
    assert(
      afterTxn6.vault.totalDebt.toNumber() == userBorrowAmount,
      "Vault Total Debt: " +
        afterTxn6.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn6.vault.totalDebt.lt(afterTxn6.vault.debtCeiling),
      "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional\n vault.totalDebt = " +
        afterTxn6.vault.totalDebt +
        " vault.debtCeiling = " +
        afterTxn6.vault.debtCeiling
    );
    assert(
      afterTxn6.globalState.totalDebt.toNumber() == userBorrowAmount,
      "Global Total Debt: " +
        afterTxn6.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn6.globalState.totalDebt.lt(afterTxn6.globalState.debtCeiling),
      "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional"
    );
    assert(
      afterTxn6.trove.debt.toNumber() == userBorrowAmount,
      "User Trove Debt: " +
        afterTxn6.trove.debt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn6.trove.debt.toNumber() == 0,
      "User Trove Debt: " + afterTxn6.trove.debt + " Expected Debt: " + 0
    );

    // TXN 7 Clean up (repay debt, withdraw deposits)
    const beforeTxn7 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn7 = await programStablePool.rpc.repayUsd(
      new anchor.BN(userDepositAmount),
      {
        accounts: {
          owner: users.base.wallet.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
          globalState: accounts.global.pubKey,
          mintUsd: accounts.mintUsd.pubKey,
          ataUserUsd: users.base.usd.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn7 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn7.vault.totalDebt.lt(afterTxn7.vault.debtCeiling),
      "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional"
    );
    assert(
      afterTxn7.vault.totalDebt.toNumber() == 0,
      "Vault Total Debt: " + afterTxn7.vault.totalDebt + " Expected Debt: " + 0
    );
    assert(
      afterTxn7.globalState.totalDebt.toNumber() == 0,
      "Global Total Debt: " + afterTxn7.vault.totalDebt + " Expected Debt: " + 0
    );
    assert(
      afterTxn7.globalState.totalDebt.lt(afterTxn7.globalState.debtCeiling),
      "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional"
    );
    assert(
      afterTxn7.trove.debt.toNumber() == 0,
      "User Trove Debt: " + afterTxn7.trove.debt + " Expected Debt: " + 0
    );

    // TXN 8
    const beforeTxn8 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn8 = await programStablePool.rpc.withdrawCollateral(
      new anchor.BN(userDepositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn8 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn8.vault.totalColl.toNumber() == localUserDepositAmount,
      "depositAmount mismatch: totalColl = " + afterTxn8.vault.totalColl
    );
    assert(
      afterTxn8.globalState.tvl.toNumber() == localUserDepositAmount,
      "tvl mistmatch: tvl = " + afterTxn8.globalState.tvl
    );
    assert(
      afterTxn8.trove.lockedCollBalance.toNumber() == 0,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn8.trove.lockedCollBalance
    );

    // TXN 9
    const beforeTxn9 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn9 = await programStablePool.rpc.withdrawCollateral(
      new anchor.BN(localUserDepositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn9 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    assert(
      afterTxn9.vault.totalColl.toNumber() == 0,
      "depositAmount mismatch: totalColl = " + afterTxn9.vault.totalColl
    );
    assert(
      afterTxn9.trove.lockedCollBalance.toNumber() == 0,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn9.trove.lockedCollBalance
    );
    assert(
      afterTxn9.globalState.tvl.toNumber() == 0,
      "tvl mistmatch: tvl = " + afterTxn9.globalState.tvl
    );
  });

  it("User can't borrow if user debt ceiling is exceeded", async () => {
    let userDepositAmount = 200_000_000;
    let userBorrowAmount = 4_000_000;
    let newUserDebtCeiling = 5_000_000;

    // TXN 1: Thie before-txn-#/after-txn-# system is to allow the tests to
    // compare before and after
    // Reset global debt ceiling to 15_000_000
    const beforeTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn1 = await programStablePool.rpc.setGlobalDebtCeiling(
      new anchor.BN(globalDebtCeiling),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn1 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn1.globalState.debtCeiling.toNumber() == globalDebtCeiling,
      "Global Debt Ceiling: " +
        afterTxn1.globalState.debtCeiling.toNumber() +
        " Expected Debt Ceiling: " +
        globalDebtCeiling
    );

    // TXN 2: Set user debt ceiling to 5_000_000
    const beforeTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn2 = await programStablePool.rpc.setUserDebtCeiling(
      new anchor.BN(newUserDebtCeiling),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          user: users.base.wallet.publicKey,
          globalState: accounts.global.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn2 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn2.trove.debtCeiling.toNumber() == newUserDebtCeiling,
      "User Debt Ceiling: " +
        afterTxn2.trove.debtCeiling.toNumber() +
        " Expected Debt Ceiling: " +
        newUserDebtCeiling
    );

    // TXN 3
    const beforeTxn3 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn3 = await programStablePool.rpc.depositCollateral(
      new anchor.BN(userDepositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn3 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn3.vault.totalColl.toNumber() == userDepositAmount,
      "depositAmount mismatch: totalColl = " + afterTxn3.vault.totalColl
    );
    assert(
      afterTxn3.trove.lockedCollBalance.toNumber() == userDepositAmount,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn3.trove.lockedCollBalance
    );
    assert(
      afterTxn3.globalState.tvl.toNumber() == userDepositAmount,
      "tvl mistmatch: tvl = " + afterTxn3.globalState.tvl
    );

    // TXN 4: First borrow should succeed since userBorrowAmount < trove.debtCeiling
    const beforeTxn4 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn4 = await programStablePool.rpc.borrowUsd(
      new anchor.BN(userBorrowAmount),
      users.base.usd.bump,
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
          globalState: accounts.global.pubKey,
          priceFeed: null as PublicKey, // incorrect but here as placeholder
          mintUsd: accounts.mintUsd.pubKey,
          ataUserUsd: users.base.usd.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn4 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn4.vault.totalDebt.lt(afterTxn4.vault.debtCeiling),
      "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional"
    );
    assert(
      afterTxn4.vault.totalDebt.toNumber() == userBorrowAmount,
      "Vault Total Debt: " +
        afterTxn4.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn4.globalState.totalDebt.toNumber() == userBorrowAmount,
      "Global Total Debt: " +
        afterTxn4.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn4.globalState.totalDebt.lt(afterTxn4.globalState.debtCeiling),
      "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional"
    );
    assert(
      afterTxn4.trove.debt.toNumber() == userBorrowAmount,
      "User Trove Debt: " +
        afterTxn4.trove.debt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn4.trove.debt.lt(afterTxn4.trove.debtCeiling),
      "User Total Debt should be less than User Debt Ceiling. User Debt ceiling not functional"
    );

    // TXN 5
    const beforeTxn5 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const borrowUsd = async () => {
      await programStablePool.rpc.borrowUsd(
        new anchor.BN(userBorrowAmount),
        users.base.usd.bump,
        {
          accounts: {
            authority: users.base.wallet.publicKey,
            vault: accounts.vaultLpSaber.pubKey,
            trove: users.base.troveLpSaber.pubKey,
            priceFeed: null as PublicKey, // incorrect but here as placeholder
            globalState: accounts.global.pubKey,
            mintUsd: accounts.mintUsd.pubKey,
            ataUserUsd: users.base.usd.pubKey,
            mintColl: accounts.mintLpSaber.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
          signers: [users.base.wallet.payer],
        }
      );
    };
    const afterTxn5 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    await expect(
      borrowUsd(),
      "No error was thrown when trying borrow an amount above user debt ceiling"
    ).is.rejected;

    // Confirm variables haven't been changed when user debt ceiling is attempted to be exceeded (ie confirm borrow failed)
    assert(
      afterTxn5.vault.totalDebt.toNumber() == userBorrowAmount,
      "Vault Total Debt: " +
        afterTxn5.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn5.vault.totalDebt.lt(afterTxn5.vault.debtCeiling),
      "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional"
    );
    assert(
      afterTxn5.globalState.totalDebt.toNumber() == userBorrowAmount,
      "Global Total Debt: " +
        afterTxn5.vault.totalDebt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn5.globalState.totalDebt.lt(afterTxn5.globalState.debtCeiling),
      "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional"
    );
    assert(
      afterTxn5.trove.debt.toNumber() == userBorrowAmount,
      "User Trove Debt: " +
        afterTxn5.trove.debt +
        " Expected Debt: " +
        userBorrowAmount
    );
    assert(
      afterTxn5.trove.debt.lt(afterTxn5.trove.debtCeiling),
      "User Total Debt should be less than User Debt Ceiling. User Debt ceiling not functional"
    );

    // TXN 6: Clean up (repay debt, withdraw deposits)
    const beforeTxn6 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn6 = await programStablePool.rpc.repayUsd(
      new anchor.BN(userDepositAmount),
      {
        accounts: {
          owner: users.base.wallet.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
          globalState: accounts.global.pubKey,
          mintUsd: accounts.mintUsd.pubKey,
          ataUserUsd: users.base.usd.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn6 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn6.vault.totalDebt.toNumber() == 0,
      "Vault Total Debt: " + afterTxn6.vault.totalDebt + " Expected Debt: " + 0
    );
    assert(
      afterTxn6.vault.totalDebt.lt(afterTxn6.vault.debtCeiling),
      "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional"
    );
    assert(
      afterTxn6.trove.debt.toNumber() == 0,
      "User Trove Debt: " + afterTxn6.trove.debt + " Expected Debt: " + 0
    );
    assert(
      afterTxn6.trove.debt.lt(afterTxn6.trove.debtCeiling),
      "User Total Debt should be less than User Debt Ceiling. User Debt ceiling not functional"
    );
    assert(
      afterTxn6.globalState.totalDebt.toNumber() == 0,
      "Global Total Debt: " + afterTxn6.vault.totalDebt + " Expected Debt: " + 0
    );
    assert(
      afterTxn6.globalState.totalDebt.lt(afterTxn6.globalState.debtCeiling),
      "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional"
    );

    // TXN 7
    const beforeTxn7 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn7 = await programStablePool.rpc.withdrawCollateral(
      new anchor.BN(userDepositAmount),
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          trove: users.base.troveLpSaber.pubKey,
          vault: accounts.vaultLpSaber.pubKey,
          ataTrove: users.base.ataTroveLpSaber.pubKey,
          ataUserColl: users.base.ataLpSaber.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    const afterTxn7 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn7.vault.totalColl.toNumber() == 0,
      "depositAmount mismatch: totalColl = " + afterTxn7.vault.totalColl
    );
    assert(
      afterTxn7.trove.lockedCollBalance.toNumber() == 0,
      "lockedCollBalance mismatch: lockedCollBalance = " +
        afterTxn7.trove.lockedCollBalance
    );
    assert(
      afterTxn7.globalState.tvl.toNumber() == 0,
      "tvl mistmatch: tvl = " + afterTxn7.globalState.tvl
    );

    // TXN 8
    const beforeTxn8 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );
    const txn8 = await programStablePool.rpc.setUserDebtCeiling(
      new anchor.BN(userDebtCeiling),
      {
        accounts: {
          payer: users.super.wallet.publicKey,
          user: users.base.wallet.publicKey,
          globalState: accounts.global.pubKey,
          mintColl: accounts.mintLpSaber.publicKey,
          vault: accounts.vaultLpSaber.pubKey,
          trove: users.base.troveLpSaber.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    const afterTxn8 = await getGlobalStateVaultAndTrove(
      accounts,
      users.base,
      accounts.vaultLpSaber
    );

    assert(
      afterTxn8.trove.debtCeiling.toNumber() == userDebtCeiling,
      "User Debt Ceiling: " +
        afterTxn8.trove.debtCeiling.toNumber() +
        " Expected Debt Ceiling: " +
        userDebtCeiling
    );
  });
});
