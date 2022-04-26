import * as testKeys from "../../.config/testKeys";
import { User } from "./user";
import { Program, Wallet, workspace } from "@project-serum/anchor";
import { StablePool } from "../../target/types/stable_pool";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { DECIMALS_USDCUSDT, DECIMALS_SBR } from "../utils/constants";
import { addZeros, airdropSol, createAtaOnChain } from "../utils/fxns";
import { TokenRewardUser } from "./TokenReward";
import { Accounts } from "../config/accounts";
import { TokenPDAUser } from "./TokenPDA";
import { TokenCollatUser } from "./TokenCollatUser";
// @ts-ignore
import { mintTo } from "@solana/spl-token";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

export class Users {
  public base: User;
  public test: User;
  public super: User;
  public oracleReporter: User;
  public treasury: User;
  public external: User;

  constructor() {
    this.base = new User(testKeys.base.keypair, "base");
    this.test = new User(testKeys.test.keypair, "test");
    this.oracleReporter = new User(
      testKeys.oracleReporter.keypair,
      "oracleReporter"
    );
    this.super = new User(
      (programStablePool.provider.wallet as Wallet).payer,
      "super"
    );
    this.treasury = new User(testKeys.treasury.keypair, "treasury");
    this.external = new User(testKeys.external.keypair, "external");
  }

  public async initAirdrops() {
    const usersArr = [
      this.base,
      this.test,
      this.external,
      this.oracleReporter,
      this.treasury,
    ];
    for (let idx = 0; idx < usersArr.length; idx += 1) {
      const user: User = usersArr[idx];

      await airdropSol(
        user.provider,
        user.wallet.publicKey,
        addZeros(100000 * LAMPORTS_PER_SOL, 0)
      );
    }
  }

  public async initUsers(accounts: Accounts) {
    await this.base.initUser();
    await this.test.initUser();
    this.base.tokens.usdx = new TokenPDAUser(
      this.base,
      accounts.usdx,
      accounts.global.pubKey
    );
    this.test.tokens.usdx = new TokenPDAUser(
      this.test,
      accounts.usdx,
      accounts.global.pubKey
    );

    await this.base.tokens.usdx.ata.initAta();
    await this.test.tokens.usdx.ata.initAta();

    this.base.tokens.sbr = new TokenRewardUser(this.base, accounts.sbr);
    this.test.tokens.sbr = new TokenRewardUser(this.test, accounts.sbr);

    // await this.base.tokens.sbr.ata.initAta(
    //   addZeros(99.9999, DECIMALS_SBR),
    //   this.base.tokens.sbr.tokenReward.quarry.mintWrapper
    //   // this.base.wallet,
    //   // this.base.provider.connection,
    //   // this.base
    // );
    await createAtaOnChain(
      this.base.wallet, // user wallet
      this.base.tokens.sbr.ata, // assoc token acct
      this.base.tokens.sbr.tokenReward.mint, // mint pub key
      this.base.wallet.publicKey, // auth, can be different than payer
      this.base.provider.connection // connection
    );
    // await mintTo(
    //   this.base.provider.connection, // connection — Connection to use
    //   // this.mintAuth.wallet.payer, // payer — Payer of the transaction fees
    //   this.base.tokens.sbr.tokenReward.mintAuth.wallet.payer, // payer — Payer of the transaction fees
    //   this.base.tokens.sbr.tokenReward.mint, // mint — Mint for the account
    //   this.base.tokens.sbr.ata, // destination — Address of the account to mint to
    //   accounts.lpSaberUsdcUsdt.pool.quarry.mintWrapper, // authority — Minting authority
    //   addZeros(99.9999, DECIMALS_SBR) // mintAmount — Amount to mint
    // );
    // await this.test.tokens.sbr.ata.initAta(
    //   addZeros(99.9999, DECIMALS_SBR),
    //   this.base.tokens.sbr.tokenReward.mintAuth.wallet,
    //   this.base.tokens.sbr.tokenReward.mintAuth.provider.connection
    // );

    // await this.test.tokens.sbr.tokenReward.mintToAta(
    //   addZeros(111.1111, DECIMALS_SBR),
    //   this.test.tokens.sbr.ata,
    //   this.test
    // );

    this.base.tokens.lpSaber = new TokenCollatUser(
      this.base,
      accounts.lpSaberUsdcUsdt,
      accounts.lpSaberUsdcUsdt.pool
    );
    this.test.tokens.lpSaber = new TokenCollatUser(
      this.test,
      accounts.lpSaberUsdcUsdt,
      accounts.lpSaberUsdcUsdt.pool
    );

    await this.base.tokens.lpSaber.tokenCollat.mintToAta(
      addZeros(10000, DECIMALS_USDCUSDT),
      this.base.tokens.lpSaber.ata,
      this.base
    );
    await this.test.tokens.lpSaber.tokenCollat.mintToAta(
      addZeros(99999, DECIMALS_USDCUSDT),
      this.test.tokens.lpSaber.ata,
      this.test
    );
  }
}
