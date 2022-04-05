import { userOracleReporterKeypair } from "../../.config/testUser-oracleReporter";
import { userTestKeypair } from "../../.config/testUser-test";
import { userBaseKeypair } from "../../.config/testUser-base";
import { User } from "./user";
import { Program, Wallet, workspace } from "@project-serum/anchor";
import { StablePool } from "../../target/types/stable_pool";
import { PublicKey } from "@solana/web3.js";
import { DECIMALS_USDCUSDT, DECIMALS_SBR } from "../utils/constants";
import { GeneralToken } from "../utils/interfaces";

const programStablePool = workspace.StablePool as Program<StablePool>;

export class Users {
  public base: User;
  public test: User;
  public super: User;
  public oracleReporter: User;

  constructor() {
    this.base = new User(userBaseKeypair);
    this.test = new User(userTestKeypair);
    this.oracleReporter = new User(userOracleReporterKeypair);
    this.super = new User((programStablePool.provider.wallet as Wallet).payer);
  }
  public async init(mintUsdxPubKey: PublicKey, mintPubKey: PublicKey, mintSbrPubKey: PublicKey) {
    await this.base.init();
    await this.base.addToken(
      mintPubKey,
      "lpSaber",
      2000 * 10 ** DECIMALS_USDCUSDT
    );
    this.base.tokens.usdx = new GeneralToken(this.base.wallet, mintUsdxPubKey);
    await this.base.addToken(mintSbrPubKey, "sbr", 99.9999 * 10 ** DECIMALS_SBR);

    // repeat for test user
    await this.test.init();
    await this.test.addToken(
      mintPubKey,
      "lpSaber",
      2000 * 10 ** DECIMALS_USDCUSDT
    );

    this.test.tokens.usdx = new GeneralToken(this.test.wallet, mintUsdxPubKey);
    await this.test.addToken(mintSbrPubKey, "sbr", 9.9999 * 10 ** DECIMALS_SBR);

    // initialize the oracle reporter (server)
    await this.oracleReporter.init();

    // initialize super owner
    await this.super.init();
    await this.super.addToken(mintSbrPubKey, "sbr", 99.9999 * 10 ** DECIMALS_SBR);
  }
}
