// anchor/solana
import { Program, workspace, setProvider } from "@project-serum/anchor";
// utils
import { use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
// local imports
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
// test imports
import {
  setGlobalTvlLimitFAIL_auth,
  setGlobalTvlLimitPASS,
} from "./setGlobalTvlLimit";
import {
  setGlobalDebtCeilingFAIL_auth,
  setGlobalDebtCeilingPASS,
} from "./setGlobalDebtCeiling";
import {
  setUserDebtCeilingFAIL_auth,
  setUserDebtCeilingPASS,
} from "./setUserDebtCeiling";
import { setHarvestFeeFAIL_auth, setHarvestFeePASS } from "./setHarvestFee";

import {
  toggleEmerStateFAIL_auth,
  toggleEmerStateFAIL_SetSameValueTwice,
  toggleEmerStatePASS,
} from "./toggleEmerState";
import {
  changeTreasuryWalletFAIL_auth,
  changeTreasuryWalletPASS,
} from "./changeTreasuryWallet";
import {
  changeAuthorityFAIL_auth,
  changeAuthorityPASS,
} from "./changeAuthority";
import { Users } from "../interfaces/users";

// init env
chaiUse(chaiAsPromised);
// constants
const programStablePool = workspace.StablePool as Program<StablePool>;
// init variables
let accounts: Accounts;
let users: Users;

// Note: admin panel unit tests must be run after global state is created
describe("Admin Panel Test Suite", async () => {
  // Configure the client to use the local cluster.
  const provider = programStablePool.provider;
  setProvider(provider);

  before(async () => {
    accounts = new Accounts(users.external, users.oracleReporter);
    await accounts.initAccounts(users.super, [users.base, users.test]);

    users = new Users();
  });

  // set global tvl limit
  it("FAIL: Set Global Tvl Limit - User is not super", async () => {
    await setGlobalTvlLimitFAIL_auth(users.base, accounts);
  });
  it("PASS: Set Global Tvl Limit", async () => {
    await setGlobalTvlLimitPASS(users.super, accounts);
  });

  // set global debt ceiling
  it("FAIL: Set Global Debt Ceiling - User is not super", async () => {
    await setGlobalDebtCeilingFAIL_auth(users.base, accounts);
  });
  it("PASS: Set Global Debt Ceiling", async () => {
    await setGlobalDebtCeilingPASS(users.super, accounts);
  });

  // set user debt ceiling
  it("FAIL: Set User Debt Ceiling - User is not super", async () => {
    await setUserDebtCeilingFAIL_auth(users.base, accounts);
  });
  it("PASS: Set User Debt Ceiling", async () => {
    await setUserDebtCeilingPASS(users.super, accounts);
  });

  // set harvest fee
  it("FAIL: Set Harvest fee - User is not super", async () => {
    await setHarvestFeeFAIL_auth(users.base, accounts);
  });
  it("PASS: Set Harvest fee", async () => {
    await setHarvestFeePASS(users.super, accounts);
  });

  // toggle emergency state
  it("PASS: Toggle Emergency State", async () => {
    await toggleEmerStatePASS(users.super, accounts);
  });
  it("FAIL: Toggle Emergency State - User is not super", async () => {
    await toggleEmerStateFAIL_auth(users.base, accounts);
  });
  it("FAIL: Toggle Emergency State - assigning same value twice", async () => {
    await toggleEmerStateFAIL_SetSameValueTwice(users.super, accounts);
  });

  // set treasury wallet
  it("FAIL: Change Treasury Wallet - User is not super", async () => {
    await changeTreasuryWalletFAIL_auth(users.base, accounts);
  });
  it("PASS: Change Treasury Wallet", async () => {
    await changeTreasuryWalletPASS(
      users.super,
      users.test.wallet.publicKey,
      accounts
    );
  });

  // change authority
  it("FAIL: Change Authority - User is not super", async () => {
    await changeAuthorityFAIL_auth(users.base, accounts);
  });
  it("PASS: Change Authority", async () => {
    await changeAuthorityPASS(users.super, users.test, accounts);
  });
});
