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
  createVaultFAIL_dup,
  createVaultFAIL_noGlobalState,
  createVaultFAIL_auth,
  createVaultPASS,
} from "./createVault";
import { createTroveFAIL_Duplicate, createTrovePASS } from "./createTrove";
import { Miner, Trove } from "../utils/interfaces";
import {
  depositCollateralFAIL_NotEnoughTokens,
  depositCollateralPASS,
  depositCollateralFAIL_DepositExceedingTVL,
} from "./depositCollateral";
import {
  withdrawCollateralFAIL_NotEnoughTokensInTrove,
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
import { createTroveRewardVault } from "./createRewardVault";
import { createSaberQuarryMinerPASS } from "../saber/createSaberQuarryMiner";
// import { depositToSaber } from "../saber/deposit";
// import { withdrawFromSaber } from "../saber/withdraw";
// import { harvestFromSaber } from "../saber/harvest";
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
      users.base.tokens.lpSaber.trove,
      accounts.quarryKey,
      accounts.lpSaberUsdcUsdt.mint
    );
  });

  // pre-global state tests
  it("FAIL: Create vault without global state", async () => {
    await createVaultFAIL_noGlobalState(
      users.base,
      accounts,
      accounts.lpSaberUsdcUsdt.vault
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

  // vault tests
  it("FAIL: Create Vault - User is not super", async () => {
    await createVaultFAIL_auth(
      users.base,
      accounts,
      accounts.lpSaberUsdcUsdt.vault
    );
  });

  it("PASS: Create Vault - lpSaberUsdcUsdt", async () => {
    await createVaultPASS(
      users.super,
      accounts,
      accounts.lpSaberUsdcUsdt.vault
    );
  });

  it("FAIL: Create Vault - duplicate", async () => {
    await createVaultFAIL_dup(
      users.super,
      accounts,
      accounts.lpSaberUsdcUsdt.vault
    );
  });

  // oracle tests - usdc oracle
  it("PASS: Create Oracle - USDC", async () => {
    await createOraclePASS(users.super, accounts, "usdc");
  });

  // oracle tests - duplicated usdc oracle
  it("FAIL: Create Oracle - Duplicate", async () => {
    await createOracleFAIL_Duplicate(users.super, accounts, 'usdc');
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

  // trove tests
  before(async () => {
    // derive trove account
    users.base.tokens.lpSaber.trove = new Trove(
      users.base.wallet,
      accounts.lpSaberUsdcUsdt.mint,
      [accounts.sbr.publicKey]
    );
  });

  it("PASS: Create Trove", async () => {
    // TODO: refactor to include just the high level classes
    await createTrovePASS(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.trove,
      accounts.lpSaberUsdcUsdt.vault,
      accounts.lpSaberUsdcUsdt.mint
    );
  });

  it("FAIL: Create Trove - Duplicate", async () => {
    // TODO: refactor to include just the high level classes
    await createTroveFAIL_Duplicate(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.trove,
      accounts.lpSaberUsdcUsdt.vault,
      accounts.lpSaberUsdcUsdt.mint
    );
  });

  it("PASS: Create Trove from another account", async () => {
    // TODO: refactor to include just the high level classes
    await createTrovePASS(
      users.test.wallet,
      users.test.provider.connection,
      users.test.tokens.lpSaber.trove,
      accounts.lpSaberUsdcUsdt.vault,
      accounts.lpSaberUsdcUsdt.mint
    );
  });

  it("FAIL: Create Trove - Duplicate from another account", async () => {
    // TODO: refactor to include just the high level classes
    await createTroveFAIL_Duplicate(
      users.test.wallet,
      users.test.provider.connection,
      users.test.tokens.lpSaber.trove,
      accounts.lpSaberUsdcUsdt.vault,
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
  // it("FAIL: Withdraw Collateral - Not Enough Tokens in Trove", async () => {
  //   await withdrawCollateralFAIL_NotEnoughTokensInTrove(users.base, accounts);
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

  // it("PASS: Withdraw Collateral from another user", async () => {
  //   await withdrawCollateralPASS(users.test, accounts);
  // });

  it("PASS: Create trove ataReward", async () => {
    // TODO: refactor to include just the high level classes
    await createTroveRewardVault(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.trove,
      accounts.lpSaberUsdcUsdt.vault,
      accounts.sbr.publicKey
    );
  });
  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
  it("PASS: Borrow/mint USDx", async () => {
    await borrowUsdxPASS(users.base, accounts);
  });

  // QUARRY MINER TESTS not working for me
  // it("PASS: Create Quarry Miner", async () => {
  //   await createSaberQuarryMinerPASS(accounts, users.base);
  // });
});
