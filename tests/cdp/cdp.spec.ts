// anchor/solana
import {
  Program,
  workspace,
  Provider,
  setProvider,
} from "@project-serum/anchor";
import {
  Keypair,
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
import { StablePool } from "../../target/types/stable_pool";
import * as constants from "../utils/constants";
import { initUsersObj, Users, usersObj } from "../config/users";
import { getGlobalStateVaultAndTrove } from "../utils/fxns";
import { Accounts, configAccountsObj } from "../config/accounts";

// init env
chaiUse(chaiAsPromised);
// constants
const programStablePool = workspace.StablePool as Program<StablePool>;
// init variables
let accounts: Accounts;
let users: Users;

describe("cdp new test suite", async () => {
  // Configure the client to use the local cluster.
  const provider = programStablePool.provider;
  setProvider(provider);
  console.log('testing here')

  before(async () => {
    accounts = await configAccountsObj(provider, usersObj);

    users = await initUsersObj(
      provider,
      accounts,
      usersObj,
      accounts.vaultLpSaber
    );
  });
  it('should first', async () => {

  })
});
