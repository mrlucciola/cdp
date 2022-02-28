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
import { createTrovePASS } from "./createTrove";
import { Trove } from "../utils/interfaces";
import { depositCollateralPASS } from "./depositCollateral";
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
    await users.init(
      accounts.lpSaberUsdcUsdt.mint,
      accounts.lpSaberUsdcUsdt.vault
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
      accounts.lpSaberUsdcUsdt.vault,
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

  // depositing collateral
  it("PASS: Deposit Collateral", async () => {
    const userlpSaber = users.base.tokens.lpSaber;
    await userlpSaber.ata.mintToATA(
      10 * 10 ** 9, // decimals for this mint
      users.super,
      accounts.lpSaberUsdcUsdt.mint
    );

    const ataBalPre = (await userlpSaber.ata.getBalance()).value.uiAmount;
    await depositCollateralPASS(users.base, accounts);
    const ataBalPost = (await userlpSaber.ata.getBalance()).value.uiAmount;
    const diff = ataBalPost - ataBalPre;
    console.log(`token balance: ${ataBalPre} -> ${ataBalPost} ∆=${diff}`);
  });
});
