// anchor/solana
import { Program, workspace, setProvider } from "@project-serum/anchor";
// utils
import { use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
// local imports
import { StablePool } from "../../target/types/stable_pool";
import { Users, usersObj } from "../config/users";
import { Accounts, configAccountsObj } from "../config/accounts";
import { createGlobalStatePASS } from "./createGlobalState";

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
    accounts = await configAccountsObj(provider, usersObj);

    users = new Users();
    await users.init(accounts.mintLpSaber);
  });

  it("PASS: Create Global State", async () => {
    await createGlobalStatePASS(accounts, users.super);
  });
});
