// utils
import {
  DECIMALS_SBR,
  DECIMALS_USDCUSDT,
  DECIMALS_USDC,
  DECIMALS_USDT,
  MINT_USDX_SEED,
  DECIMALS_USDX,
} from "../utils/constants";
import { addZeros } from "../utils/fxns";
// interfaces
import { TokenReward } from "../interfaces/TokenReward";
import { User } from "../interfaces/user";
import { TokenCollat } from "../interfaces/TokenCollat";
import { TokenMarket } from "../interfaces/TokenMarket";
import { TokenPda } from "../interfaces/TokenPDA";
import { GlobalState } from "../interfaces/GlobalState";

export class Accounts {
  public global: GlobalState;
  public usdx: TokenPda;
  public sbr: TokenReward;
  public lpSaberUsdcUsdt: TokenCollat;
  public usdc: TokenMarket;
  public usdt: TokenMarket;

  constructor(externalUser: User, oracleReporter: User) {
    // init usdx mint acct
    this.usdx = new TokenPda(MINT_USDX_SEED, [], "usdx", DECIMALS_USDX);
    // init global state acct
    this.global = new GlobalState(this.usdx, oracleReporter);

    // create the market tokens
    this.usdc = new TokenMarket(
      externalUser,
      DECIMALS_USDC,
      "usdc",
      "usdcUsdt",
      "saber"
    );
    this.usdt = new TokenMarket(
      externalUser,
      DECIMALS_USDT,
      "usdt",
      "usdcUsdt",
      "saber"
    );

    // create the reward token
    this.sbr = new TokenReward(externalUser, "sbr", DECIMALS_SBR); // rewardsMintKP.publicKey,

    // init the collateral token (lp)
    this.lpSaberUsdcUsdt = new TokenCollat(
      externalUser,
      this.sbr,
      "lpSaberUsdcUsdt",
      DECIMALS_USDCUSDT,
      "saber",
      "usdcUsdt",
      [
        { name: "usdc", tokenMarket: this.usdc },
        { name: "usdt", tokenMarket: this.usdt },
      ]
    );
  }

  public async initAccounts(userSuper: User, platformParticipants: User[]) {
    // init the token mint, oracle and market-token
    await this.global.initGlobalState(userSuper);
    await this.sbr.initTokenReward();
    await this.usdc.initMktToken(addZeros(25331785.961795, DECIMALS_USDC)); // amount found on explorer.solana.com on 3/24/22 5:15pm EST
    await this.usdt.initMktToken(addZeros(16555962.623743, DECIMALS_USDT)); // amount found on explorer.solana.com on 3/24/22 5:15pm EST

    // init the token mint, oracle and market token
    await this.lpSaberUsdcUsdt.initCdpCollat();

    await this.lpSaberUsdcUsdt.initCollatForUsers(platformParticipants);
  }
}
