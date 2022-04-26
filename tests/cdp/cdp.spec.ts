// anchor/solana
import { Program, workspace, setProvider } from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
// utils
import { use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
// local imports
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import stablePoolKeypair from "../../target/deploy/stable_pool-keypair.json";
import {
  // createGlobalStateFAIL_auth,
  // createGlobalStateFAIL_duplicate,
  createGlobalStatePASS,
} from "./createGlobalState";
import {
  // createPoolFAIL_dup,
  createPoolFAIL_noGlobalState,
  // createPoolFAIL_auth,
  createPoolPASS,
} from "./createPool";
import {
  // setPoolDebtCeilingFAIL_auth,
  setPoolDebtCeilingPASS,
} from "../admin-panel/setPoolDebtCeiling";
import { createVaultFAIL_Duplicate, createVaultPASS } from "./createVault";
import {
  depositCollateralPASS,
  // depositCollateralFAIL_NotEnoughTokens,
  // depositCollateralFAIL_DepositExceedingTVL,
} from "./depositCollateral";
import {
  // withdrawCollateralFAIL_NotEnoughTokensInVault,
  // withdrawCollateralFAIL_AttemptWithdrawFromOtherUser,
  withdrawCollateralPASS,
} from "./withdrawCollateral";
import { borrowUsdxPASS } from "./borrowUsdx";
// import { harvestRewardsPASS } from "./harvestReward";
// import { DECIMALS_USDCUSDT } from "../utils/constants";
import {
  // reportPriceToOracleFAIL_NotUpdater,
  reportPriceToOraclePASS,
} from "./reportPriceToOracle";
import { createOracleFAIL_Duplicate, createOraclePASS } from "./createOracle";
import { createSaberQuarryMinerPASS } from "../saber/createSaberQuarryMiner";
// import { stakeCollateralToSaberPASS } from "../saber/stakeCollateralToSaber";
// import {
//   unstakeColalteralFromSaberFAIL_AttemptToUnstakeMoreThanWasStaked,
//   unstakeColalteralFromSaberFAIL_AttemptToUnstakeFromAnotherUser,
//   unstakeColalteralFromSaberPASS,
// } from "../saber/unstakeCollateralFromSaber";
// import { harvestRewardsFromSaberPASS } from "../saber/harvestRewardFromSaber";
import {
  // repayUsdxFAIL_RepayMoreThanBorrowed,
  repayUsdxPASS_RepayFullAmountBorrowed,
  // repayUsdxPASS_RepayLessThanBorrowed,
  // repayUsdxFAIL_ZeroUsdx,
  // repayUsdxFAIL_RepayAnotherUsersDebt,
} from "../cdp/repayUsdx";
// import {
//   emergencyStatePASS_DepositDisabled,
//   emergencyStatePASS_BorrowDisabled,
//   emergencyStatePASS_WithdrawDisabled,
// } from "../cdp/emergencyState";
import { createUserStatePASS } from "./createUserState";
// import { depositAndStakeCollatPASS } from "./depositAndStakeCollat";
// interfaces
import { Users } from "../interfaces/users";
import { setGlobalTvlLimitPASS } from "../admin-panel/setGlobalTvlLimit";

const programKp = Keypair.fromSecretKey(
  new Uint8Array(stablePoolKeypair as any[])
);

// init env
chaiUse(chaiAsPromised);
// constants
const programStablePool = workspace.StablePool as Program<StablePool>;
// init variables
let accounts: Accounts;
const users = new Users();
console.log("program keys id: ", programKp.publicKey.toString());

describe("cdp core test suite", async () => {
  // Configure the client to use the local cluster.
  const provider = programStablePool.provider;
  setProvider(provider);

  before(async () => {
    await users.initAirdrops();
    accounts = new Accounts(users.external, users.oracleReporter);
    await accounts.initAccounts(users.super, [users.base, users.test]);

    await users.initUsers(accounts);
  });

  // pre-global state tests
  it("FAIL: Create pool without global state", async () => {
    await createPoolFAIL_noGlobalState(
      users.base,
      accounts,
      accounts.lpSaberUsdcUsdt.pool
    );
  });

  // // global state tests
  // it("FAIL: Create Global State - User is not super", async () => {
  //   await createGlobalStateFAIL_auth(
  //     users.base,
  //     users.oracleReporter,
  //     accounts
  //   );
  // });

  it("PASS: Create Global State", async () => {
    await createGlobalStatePASS(users.super, accounts);
    await setGlobalTvlLimitPASS(users.super, accounts);
  });

  // it("FAIL: Create Global State - duplicate", async () => {
  //   await createGlobalStateFAIL_duplicate(
  //     users.oracleReporter,
  //     users.super,
  //     accounts
  //   );
  // });

  // // pool tests
  // it("FAIL: Create Pool - User is not super", async () => {
  //   await createPoolFAIL_auth(
  //     users.base,
  //     accounts,
  //     accounts.lpSaberUsdcUsdt.pool
  //   );
  // });

  it("PASS: Create Pool - lpSaberUsdcUsdt", async () => {
    await createPoolPASS(users.super, accounts, accounts.lpSaberUsdcUsdt.pool);
  });

  // it("FAIL: Create Pool - duplicate", async () => {
  //   await createPoolFAIL_dup(
  //     users.super,
  //     accounts,
  //     accounts.lpSaberUsdcUsdt.pool
  //   );
  // });

  // // set pool debt ceiling
  // it("FAIL: Set Pool Debt Ceiling - User is not super", async () => {
  //   await setPoolDebtCeilingFAIL_auth(
  //     users.base,
  //     accounts.lpSaberUsdcUsdt.pool,
  //     accounts
  //   );
  // });

  it("PASS: Set Pool Debt Ceiling", async () => {
    await setPoolDebtCeilingPASS(
      users.super,
      accounts.lpSaberUsdcUsdt.pool,
      accounts
    );
  });

  // // oracle tests - usdc oracle
  it("PASS: Create Oracle - USDC", async () => {
    await createOraclePASS(users.oracleReporter, accounts, "usdc");
  });

  // // oracle tests - duplicated usdc oracle
  // it("FAIL: Create Oracle - Duplicate", async () => {
  //   await createOracleFAIL_Duplicate(users.oracleReporter, accounts, "usdc");
  // });

  // // oracle tests - usdt oracle
  it("PASS: Create Oracle - USDT", async () => {
    await createOraclePASS(users.oracleReporter, accounts, "usdt");
  });

  it("PASS: Report Price - USDC", async () => {
    await reportPriceToOraclePASS(users.oracleReporter, accounts);
  });

  // it("FAIL: Update Price Feed - Not Updater", async () => {
  //   // TODO: refactor to include just the high level classes
  //   const newPrice = 134000000;

  //   await reportPriceToOracleFAIL_NotUpdater(users.base, accounts, newPrice);
  // });

  it("PASS: Create User State", async () => {
    await createUserStatePASS(users.base);
    await createUserStatePASS(users.test);
  });

  // vault tests
  it("PASS: Create Vault for base user", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultPASS(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.vault, // TODO: vault -> pool
      accounts.lpSaberUsdcUsdt.pool,
      accounts.lpSaberUsdcUsdt.mint
    );
  });

  // it("FAIL: Create Vault - Duplicate", async () => {
  //   // TODO: refactor to include just the high level classes
  //   await createVaultFAIL_Duplicate(
  //     users.base.wallet,
  //     users.base.provider.connection,
  //     users.base.tokens.lpSaber.vault, // TODO: vault -> pool
  //     accounts.lpSaberUsdcUsdt.pool,
  //     accounts.lpSaberUsdcUsdt.mint
  //   );
  // });

  it("PASS: Create Vault for test user", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultPASS(
      users.test.wallet,
      users.test.provider.connection,
      users.test.tokens.lpSaber.vault, // TODO: vault -> pool
      accounts.lpSaberUsdcUsdt.pool,
      accounts.lpSaberUsdcUsdt.mint
    );
  });

  // it("FAIL: Create Vault - Duplicate from another account", async () => {
  //   // TODO: refactor to include just the high level classes
  //   await createVaultFAIL_Duplicate(
  //     users.test.wallet,
  //     users.test.provider.connection,
  //     users.test.tokens.lpSaber.vault, // TODO: vault -> pool
  //     accounts.lpSaberUsdcUsdt.pool,
  //     accounts.lpSaberUsdcUsdt.mint
  //   );
  // });

  // depositing collateral
  // it("FAIL: Deposit Collateral - Not Enough Tokens", async () => {
  //   await depositCollateralFAIL_NotEnoughTokens(users.test, accounts);
  // });

  it("PASS: Create Quarry Miner", async () => {
    await createSaberQuarryMinerPASS(users.base, accounts);
    await createSaberQuarryMinerPASS(users.test, accounts);
  });
  it("PASS: Deposit Collateral - first time for base", async () => {
    await depositCollateralPASS(users.base, accounts);
  });

  it("PASS: Deposit Collateral - first time for test", async () => {
    await depositCollateralPASS(users.test, accounts);
  });

  // it("FAIL: Deposit Collateral - Deposit Exceeding TVL", async () => {
  //   // mint tokens to the user's account first
  //   await depositCollateralFAIL_DepositExceedingTVL(users.base, accounts);
  // });

  // withrawing collateral
  // it("FAIL: Withdraw Collateral - Not Enough Tokens in Vault", async () => {
  //   await withdrawCollateralFAIL_NotEnoughTokensInVault(users.base, accounts);
  // });

  // it("FAIL: Withdraw Collateral - Attempt Withdraw From Other User", async () => {
  //   await withdrawCollateralFAIL_AttemptWithdrawFromOtherUser(
  //     users.base,
  //     users.test,
  //     accounts
  //   );
  // });

  it("PASS: Withdraw collateral", async () => {
    await withdrawCollateralPASS(users.base, accounts);
    await withdrawCollateralPASS(users.test, accounts);
  });

  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
  it("PASS: Borrow/mint USDx for base", async () => {
    await borrowUsdxPASS(users.base, accounts);
  });
  it("PASS: Borrow/mint USDx for test", async () => {
    await borrowUsdxPASS(users.test, accounts);
  });

  // repay
  // it("FAIL: Repay USDx - Repaying More Than Originally Borrowed", async () => {
  //   await repayUsdxFAIL_RepayMoreThanBorrowed(
  //     users.base,
  //     users.base.tokens.lpSaber.vault,
  //     accounts);
  // });
  it("PASS: Repay USDx - Repaying Exact Amount Originally Borrowed", async () => {
    await repayUsdxPASS_RepayFullAmountBorrowed(users.base, accounts);
  });
  // it("PASS: Repay USDx - Repaying Less Than Amount Originally Borrowed", async () => {
  //   await repayUsdxPASS_RepayLessThanBorrowed(
  //     users.base,
  //     users.base.tokens.lpSaber.vault,
  //     accounts);
  // });
  // it("FAIL: Repay USDx - Cannot Repay 0 USDx", async () => {
  //   await repayUsdxFAIL_ZeroUsdx(
  //     users.base,
  //     users.base.tokens.lpSaber.vault,
  //     accounts);
  // });
  // it("FAIL: Repay USDx - Cannot Repay Another User's Debt", async () => {
  //   await repayUsdxFAIL_RepayAnotherUsersDebt(
  //     users.base,
  //     users.test,
  //     users.test.tokens.lpSaber.vault,
  //     accounts);
  // });

  // it("PASS: Create vault ataReward", async () => {
  //   // TODO: refactor to include just the high level classes
  //   await createVaultRewardVault(
  //     users.base.wallet,
  //     users.base.provider.connection,
  //     users.base.tokens.lpSaber.vault,
  //     accounts.lpSaberUsdcUsdt.pool,
  //     accounts.sbr.mint
  //   );
  // });

  // // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
  // // this works but we need fail tests
  // it("PASS: Borrow/mint USDx", async () => {
  //   await borrowUsdxPASS(users.base, accounts);
  // });

  // it("PASS: Emergency State Disables Deposits", async () => {
  //   await emergencyStatePASS_DepositDisabled(users.super, users.base, accounts);
  // });

  // it("PASS: Emergency State Disables Borrowing", async () => {
  //   await emergencyStatePASS_BorrowDisabled(users.super, users.base, accounts);
  // });

  // it("PASS: Emergency State Disables Withdraws", async () => {
  //   await emergencyStatePASS_WithdrawDisabled(
  //     users.super,
  //     users.base,
  //     accounts
  //   );
  // });

  // // This works

  // it("PASS: Harvest rewards from the User Vault", async () => {
  //   await harvestRewardsPASS(users.base, users.super, accounts);
  // });

  // it("FAIL: Unstake From Saber - Try To Unstake More Than Was Staked", async () => {
  //   await unstakeColalteralFromSaberFAIL_AttemptToUnstakeMoreThanWasStaked(
  //     users.base,
  //     accounts
  //   );
  // });

  // it("PASS: Stake to saber", async () => {
  //   await stakeCollateralToSaberPASS(users.base, accounts);
  // });

  // it("PASS: Harvest rewards from the saber quarry mine", async () => {
  //   await harvestRewardsFromSaberPASS(users.base, users.super, accounts);
  // });

  // it("FAIL: Unstake From Saber - Try To Unstake More Than Was Staked", async () => {
  //   await unstakeColalteralFromSaberFAIL_AttemptToUnstakeMoreThanWasStaked(
  //     users.base,
  //     accounts
  //   );
  // });

  // it("FAIL: Unstake From Saber - Unstake For Another User", async () => {
  //   await unstakeColalteralFromSaberFAIL_AttemptToUnstakeFromAnotherUser(
  //     users.base,
  //     users.test,
  //     accounts
  //   );
  // });

  // it("PASS: Unstake From Saber", async () => {
  //   await unstakeColalteralFromSaberPASS(users.base, accounts);
  // });

  // it("PASS: Deposit and stake to Saber miner", async () => {
  //   const amtToStake = 100 * 10 ** DECIMALS_USDCUSDT;
  //   await depositAndStakeCollatPASS(users.base, accounts, amtToStake);
  // });
});
