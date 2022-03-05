// anchor/solana
import { Program, workspace, setProvider } from "@project-serum/anchor";
// utils
import { assert, use as chaiUse } from "chai";
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
import { Trove } from "../utils/interfaces";
import { 
  depositCollateralFAIL_NotEnoughTokens,
  depositCollateralPASS,
  depositCollateralFAIL_DepositExceedingTVL
} from "./depositCollateral";
import {
  withdrawCollateralFAIL_NotEnoughTokensInTrove,
  withdrawCollateralFAIL_AttemptWithdrawFromOtherUser,
  withdrawCollateralPASS
} from "./withdrawCollateral";
import { borrowUsdxPASS } from "./borrowUsdx";
import * as constants from "../utils/constants";

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

    users = new Users();
    await users.init(accounts.lpSaberUsdcUsdt.mint);
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
    await createGlobalStateFAIL_auth(users.base, accounts);
  });
  it("PASS: Create Global State", async () => {
    await createGlobalStatePASS(users.super, accounts);
  });
  it("FAIL: Create Global State - duplicate", async () => {
    await createGlobalStateFAIL_duplicate(users.super, accounts);
  });

  // vault tests
  it("FAIL: Create Vault - User is not super", async () => {
    await createVaultFAIL_auth(
      users.base,
      accounts,
      accounts.lpSaberUsdcUsdt.vault
    );
  });
  it("PASS: Create Vault", async () => {
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

  // trove tests
  before(async () => {
    // derive trove account
    users.base.tokens.lpSaber.trove = new Trove(
      users.base.wallet,
      accounts.lpSaberUsdcUsdt.mint
    );
  });
  it("PASS: Create Trove", async () => {
    await createTrovePASS(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.trove,
      accounts.lpSaberUsdcUsdt.vault,
      accounts.lpSaberUsdcUsdt.mint
    );
  });
  it("FAIL: Create Trove - Duplicate", async () => {
    await createTroveFAIL_Duplicate(
      users.base.wallet,
      users.base.provider.connection,
      users.base.tokens.lpSaber.trove,
      accounts.lpSaberUsdcUsdt.vault,
      accounts.lpSaberUsdcUsdt.mint
    );
  });
  it("PASS: Create Trove from another account", async () => {
    await createTrovePASS(
      users.test.wallet,
      users.test.provider.connection,
      users.test.tokens.lpSaber.trove,
      accounts.lpSaberUsdcUsdt.vault,
      accounts.lpSaberUsdcUsdt.mint
    );
  });
  it("FAIL: Create Trove - Duplicate from another account", async () => {
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
      10 * 10 ** 9, // decimals for this mint = 9
      users.super,
      accounts.lpSaberUsdcUsdt.mint
    );
    await depositCollateralPASS(users.base, accounts);
  });
  it("PASS: Deposit Collateral from another user", async () => {
    // mint tokens to the user's account first
    await users.test.tokens.lpSaber.ata.mintToATA(
      10 * 10 ** 9, // decimals for this mint = 9
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
  it("FAIL: Withdraw Collateral - Not Enough Tokens in Trove", async () => {
    await withdrawCollateralFAIL_NotEnoughTokensInTrove(users.base, accounts);
  });
  it("FAIL: Withdraw Collateral - Attempt Withdraw From Other User", async () => {
    await withdrawCollateralFAIL_AttemptWithdrawFromOtherUser(users.base, users.test, accounts);
  });
  it("PASS: Withdraw Collateral", async () => {
    await withdrawCollateralPASS(users.base, accounts);
  });
  it("PASS: Withdraw Collateral from another user", async () => {
    await withdrawCollateralPASS(users.test, accounts);
  });

  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
  it("PASS: Borrow/mint USDx", async () => {
    // await borrowUsdxPASS(users.base, accounts);
  });
});
