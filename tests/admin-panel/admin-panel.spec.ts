// anchor/solana
import { Program, workspace, setProvider } from "@project-serum/anchor";
// utils
import { assert, use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
// local imports
import { StablePool } from "../../target/types/stable_pool";
import { Users } from "../config/users";
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
    accounts = new Accounts();
    await accounts.init();

    users = new Users();
  });

  it("FAIL: Set Global Tvl Limit - User is not super", async () => {
    await setGlobalTvlLimitFAIL_auth(users.base, accounts);
  });
  it("PASS: Set Global Tvl Limit", async () => {
    await setGlobalTvlLimitPASS(users.super, accounts);
  });
  it("FAIL: Set Global Debt Ceiling - User is not super", async () => {
    await setGlobalDebtCeilingFAIL_auth(users.base, accounts);
  });
  it("PASS: Set Global Debt Ceiling", async () => {
    await setGlobalDebtCeilingPASS(users.super, accounts);
  });
  it("FAIL: Set User Debt Ceiling - User is not super", async () => {
    await setUserDebtCeilingFAIL_auth(users.base, accounts);
  });
  it("PASS: Set User Debt Ceiling", async () => {
    await setUserDebtCeilingPASS(users.super, accounts);
  });
});