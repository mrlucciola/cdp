// anchor/solana
import { Program, workspace, setProvider } from "@project-serum/anchor";
// utils
import { use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
// local imports
import { StablePool } from "../../target/types/stable_pool";
import { Users } from "../config/users";
import { Accounts } from "../config/accounts";
import {
  createGlobalStateFAIL_auth,
  createGlobalStateFAIL_duplicate,
  createGlobalStatePASS,
} from "./createGlobalState";
import {
  createPoolFAIL_dup,
  createPoolFAIL_noGlobalState,
  createPoolFAIL_auth,
  createPoolPASS,
} from "./createPool";
import { createVaultFAIL_Duplicate, createVaultPASS } from "./createVault";
import { Miner, Vault } from "../utils/interfaces";
import {
  depositCollateralFAIL_NotEnoughTokens,
  depositCollateralPASS,
  depositCollateralFAIL_DepositExceedingTVL,
} from "./depositCollateral";
import {
  withdrawCollateralFAIL_NotEnoughTokensInVault,
  withdrawCollateralFAIL_AttemptWithdrawFromOtherUser,
  withdrawCollateralPASS,
} from "./withdrawCollateral";
import { borrowUsdxPASS } from "./borrowUsdx";
import { DECIMALS_USDCUSDT } from "../utils/constants";
import {
  reportPriceToOracleFAIL_NotUpdater,
  reportPriceToOraclePASS,
} from "./reportPriceToOracle";
import { createOracleFAIL_Duplicate, createOraclePASS } from "./createOracle";
import { createVaultRewardVault } from "./createRewardVault";
import { createSaberQuarryMinerPASS } from "../saber/createSaberQuarryMiner";
import { stakeCollateralToSaberPASS } from "../saber/stakeCollateralToSaber";
// import { withdrawFromSaber } from "../saber/withdraw";
// import { harvestFromSaber } from "../saber/harvest";
import {
  repayUsdxFAIL_RepayMoreThanBorrowed,
  repayUsdxPASS_RepayFullAmountBorrowed,
  repayUsdxPASS_RepayLessThanBorrowed,
  repayUsdxFAIL_ZeroUsdx,
  repayUsdxFAIL_RepayAnotherUsersDebt,
} from "../cdp/repayUsdx";
import { sleep } from "@saberhq/token-utils";

// init env
chaiUse(chaiAsPromised);
// constants
const programStablePool = workspace.StablePool as Program<StablePool>;
// init variables
let accounts: Accounts;
let users: Users;

describe("cdp core test suite", async () => {
  // Configure the client to use the local cluster.
  const provider = programStablePool.provider;
  setProvider(provider);
  before(async () => {
    accounts = new Accounts();
    await accounts.init();
    await accounts.initQuarry();

    users = new Users();
    await users.init(accounts.usdx.pubKey, accounts.lpSaberUsdcUsdt.mint);
    // create miner
    users.base.miner = new Miner(
      users.base.tokens.lpSaber.vault,
      accounts.quarryKey,
      accounts.lpSaberUsdcUsdt.mint
    );
  });

  // pre-global state tests
  it("FAIL: Create pool without global state", async () => {
    await createPoolFAIL_noGlobalState(
      users.base,
      accounts,
      accounts.lpSaberUsdcUsdt.pool
    );
  });

  // global state tests
  it("FAIL: Create Global State - User is not super", async () => {
    await createGlobalStateFAIL_auth(
      users.base,
      users.oracleReporter,
      accounts
    );
  });

  it("PASS: Create Global State", async () => {
    await createGlobalStatePASS(users.super, users.oracleReporter, accounts);
  });

  it("FAIL: Create Global State - duplicate", async () => {
    await createGlobalStateFAIL_duplicate(
      users.oracleReporter,
      users.super,
      accounts
    );
  });

  // pool tests
  it("FAIL: Create Pool - User is not super", async () => {
    await createPoolFAIL_auth(
      users.base,
      accounts,
      accounts.lpSaberUsdcUsdt.pool
    );
  });

  it("PASS: Create Pool - lpSaberUsdcUsdt", async () => {
    await createPoolPASS(
      users.super,
      accounts,
      accounts.lpSaberUsdcUsdt.pool
    );
  });

  it("FAIL: Create Pool - duplicate", async () => {
    await createPoolFAIL_dup(
      users.super,
      accounts,
      accounts.lpSaberUsdcUsdt.pool
    );
  });

  // oracle tests - usdc oracle
  it("PASS: Create Oracle - USDC", async () => {
    await createOraclePASS(users.super, accounts, "usdc");
  });

  // oracle tests - duplicated usdc oracle
  it("FAIL: Create Oracle - Duplicate", async () => {
    await createOracleFAIL_Duplicate(users.super, accounts, "usdc");
  });

  // oracle tests - usdt oracle
  it("PASS: Create Oracle - USDT", async () => {
    await createOraclePASS(users.super, accounts, "usdt");
  });

  it("PASS: Report Price - USDC", async () => {
    // TODO: refactor to include just the high level classes
    const newPrice = 102000000;
    accounts.usdc.oracle.price = newPrice;
    await reportPriceToOraclePASS(
      users.oracleReporter.provider.connection,
      users.oracleReporter.wallet,
      accounts,
      accounts.usdc.oracle,
      newPrice
    );
  });

  it("FAIL: Update Price Feed - Not Updater", async () => {
    // TODO: refactor to include just the high level classes
    const newPrice = 134000000;
    await reportPriceToOracleFAIL_NotUpdater(
      users.base.provider.connection,
      users.base.wallet,
      accounts,
      accounts.usdc.oracle,
      newPrice
    );
  });

  // vault tests
  before(async () => {
    // derive vault account
    users.base.tokens.lpSaber.vault = new Vault(
      users.base.wallet,
      accounts.lpSaberUsdcUsdt.mint,
      [accounts.sbr.publicKey]
    );
  });

  it("PASS: Create Vault", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultPASS(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.vault, // TODO: vault -> pool
      accounts.lpSaberUsdcUsdt.pool,
      accounts.lpSaberUsdcUsdt.mint
    );
  });

  it("FAIL: Create Vault - Duplicate", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultFAIL_Duplicate(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.vault, // TODO: vault -> pool
      accounts.lpSaberUsdcUsdt.pool,
      accounts.lpSaberUsdcUsdt.mint
    );
  });

  it("PASS: Create Vault from another account", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultPASS(
      users.test.wallet,
      users.test.provider.connection,
      users.test.tokens.lpSaber.vault, // TODO: vault -> pool
      accounts.lpSaberUsdcUsdt.pool,
      accounts.lpSaberUsdcUsdt.mint
    );
  });

  it("FAIL: Create Vault - Duplicate from another account", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultFAIL_Duplicate(
      users.test.wallet,
      users.test.provider.connection,
      users.test.tokens.lpSaber.vault, // TODO: vault -> pool
      accounts.lpSaberUsdcUsdt.pool,
      accounts.lpSaberUsdcUsdt.mint
    );
  });

  // depositing collateral
  it("FAIL: Deposit Collateral - Not Enough Tokens", async () => {
    await depositCollateralFAIL_NotEnoughTokens(users.test, accounts);
  });

  it("PASS: Deposit Collateral", async () => {
    // mint tokens to the user's account first
    await users.base.tokens.lpSaber.ata.mintToATA(
      1000 * 10 ** DECIMALS_USDCUSDT, // decimals for this mint = 9
      users.super,
      accounts.lpSaberUsdcUsdt.mint
    );
    await depositCollateralPASS(users.base, accounts);
  });

  it("PASS: Deposit Collateral from another user", async () => {
    // mint tokens to the user's account first
    await users.test.tokens.lpSaber.ata.mintToATA(
      10 * 10 ** DECIMALS_USDCUSDT, // decimals for this mint = 9
      users.super,
      accounts.lpSaberUsdcUsdt.mint
    );
    await depositCollateralPASS(users.test, accounts);
  });

  it("FAIL: Deposit Collateral - Deposit Exceeding TVL", async () => {
    // mint tokens to the user's account first
    await depositCollateralFAIL_DepositExceedingTVL(users.base, accounts);
  });

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

  it("PASS: Withdraw Collateral", async () => {
    await withdrawCollateralPASS(users.base, accounts);
  });

  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
  it("PASS: Borrow/mint USDx", async () => {
    // await borrowUsdxPASS(users.base, accounts);
  });

  // repay
  // it("FAIL: Repay USDx - Repaying More Than Originally Borrowed", async () => {
  //   await repayUsdxFAIL_RepayMoreThanBorrowed(
  //     users.base,
  //     users.base.tokens.lpSaber.vault,
  //     accounts);
  // });
  // it("PASS: Repay USDx - Repaying Exact Amount Originally Borrowed", async () => {
  //   await repayUsdxPASS_RepayFullAmountBorrowed(
  //     users.base,
  //     users.base.tokens.lpSaber.vault,
  //     accounts);
  // });
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

  it("PASS: Create vault ataReward", async () => {
    // TODO: refactor to include just the high level classes
    await createVaultRewardVault(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.vault,
      accounts.lpSaberUsdcUsdt.pool,
      accounts.sbr.publicKey
    );
  });

  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
  // this works but we need fail tests
  it("PASS: Borrow/mint USDx", async () => {
    await borrowUsdxPASS(users.base, accounts);
  });

  // This works
  it("PASS: Create Quarry Miner", async () => {
    await createSaberQuarryMinerPASS(users.base, accounts);
  });

  it("PASS: Stake to saber", async () => {
    await stakeCollateralToSaberPASS(users.base, accounts);
  });
});
