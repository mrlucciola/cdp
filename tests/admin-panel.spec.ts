// anchor/solana
import * as anchor from "@project-serum/anchor";
import { StablePool } from "../target/types/stable_pool";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
// testing utils
import { use as chaiUse, assert } from "chai";
import chaiAsPromised from "chai-as-promised";
// local
import * as constants from "./utils/constants";
import { initUsersObj, Users, usersObj } from "./config/users";
import { getSolBalance } from "./utils/fxns";
import { Accounts, configAccountsObj } from "./config/accounts";

chaiUse(chaiAsPromised);



// JKAP: THESE TESTS ARE INCOMPLETE. THIS IS MID-REFACTOR.
//     THERE ARE STILL VARIABLES THAT HAVENT BEEN FIGURED OUT




const stablePoolProgram = anchor.workspace
  .StablePool as anchor.Program<StablePool>;

describe("admin-panel", function () {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const tvlLimit = 1_000_000_000;
  const globalDebtCeiling = 15_000_000;

  let accounts: Accounts;
  let users: Users;

  this.beforeAll(async function () {
    accounts = await configAccountsObj(provider, usersObj);
    users = await initUsersObj(
      provider,
      accounts,
      usersObj,
      accounts.vaultLpSaber
    );
    console.log("authority =", users.super.wallet.publicKey.toBase58());
    console.log("user =", users.base.wallet.publicKey.toBase58());

    await accounts.mintLpSaber.mintTo(
      users.base.ataLpSaber.pubKey,
      users.super.wallet.payer,
      [],
      200_000_000 /* 0.2 LPT */
    );
  });

  it("Create Global State", async () => {
    // TXN 1
    let txn1 = await stablePoolProgram.rpc.createGlobalState(
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
    const globalState = await stablePoolProgram.account.globalState.fetch(
      accounts.global.pubKey
    );
    assert(
      globalState.authority.toBase58() ==
        users.super.wallet.publicKey.toBase58()
    );
    assert(
      globalState.mintUsd.toBase58() == accounts.mintUsd.pubKey.toBase58()
    );
    assert(
      globalState.tvlLimit.toNumber() == tvlLimit,
      "GlobalState TVL Limit: " +
        globalState.tvlLimit +
        " TVL Limit: " +
        tvlLimit
    );
    assert(globalState.tvl.toNumber() == 0);
  });

  it("Pause CDP in Emergency state", async () => {
    // TXN 1
    const txn1 = await stablePoolProgram.rpc.toggleEmerState(
      1, // paused
      {
        accounts: {
          authority: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    let globalState = await stablePoolProgram.account.globalState.fetch(
      accounts.global.pubKey
    );
    assert(globalState.paused == 1, "CDP Not Paused");
  });

  it("Resume CDP in Emergency state", async () => {
    // TXN 1
    const txn1 = await stablePoolProgram.rpc.toggleEmerState(
      0, // paused
      {
        accounts: {
          authority: users.super.wallet.publicKey,
          globalState: accounts.global.pubKey,
        },
        signers: [users.super.wallet.payer],
      }
    );
    console.log("tx =", txn1);
    let globalState = await stablePoolProgram.account.globalState.fetch(
      accounts.global.pubKey
    );
    assert(globalState.paused == 0, "CDP Not Resumed");
  });

  it("Pause CDP in Emergency state with other user", async () => {
    // TXN 1
    const txn1 = await stablePoolProgram.rpc.toggleEmerState(
      1, // paused
      {
        accounts: {
          authority: users.base.wallet.publicKey,
          globalState: accounts.global.pubKey,
        },
        signers: [users.base.wallet.payer],
      }
    );
    console.log("tx =", txn1);
    let globalState = await stablePoolProgram.account.globalState.fetch(
      accounts.global.pubKey
    );
    assert(globalState.paused == 1, "CDP Not Paused");
  });
});
