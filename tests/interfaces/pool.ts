// anchor/solana
import { IdlAccounts, Program, web3, workspace } from "@project-serum/anchor";
// generated
import { StablePool } from "../../target/types/stable_pool";
// local
import { DEBT_CEILING_POOL_USDX, POOL_SEED } from "../utils/constants";
import { AtaMarket, BaseAcct, MintPubKey } from "../utils/interfaces";
import { Oracle } from "./oracle";
import { QuarryClass } from "./quarry";
import { TokenCollat } from "./TokenCollat";
import { TokenMarket } from "./TokenMarket";
import { TokenReward } from "./TokenReward";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

const platformNameToNumber = (platformName: string) => {
  const platformMapping = {
    raydium: 0,
    orca: 1,
    saber: 2,
    mercurial: 3,
    unknown: 4,
  };
  const platformNumber = platformMapping[platformName];

  return platformNumber;
};

/**
 * The general class for pool state accounts
 *
 * Pools pertain to a single collateral token, which comes from a:
 *   single market,
 *   single platform,
 *   single farm
 *
 * They contain links to oracles, the token accounts in the market they come from
 */
export class Pool extends BaseAcct {
  // TODO 008: change pool.name to pool.nameCollat
  name: string;
  platform: string;
  oracles: {
    usdc?: Oracle;
    usdt?: Oracle;
  };
  ataMarketTokens: {
    usdc?: AtaMarket;
    usdt?: AtaMarket;
  };
  /**
   * TODO 001: change to rewardTokens[] where each item is a RewardToken instance
   *    We need to access [mint, mintAuth, name, etc.] from multiple places
   */
  rewardTokenMints: MintPubKey[];
  tokenReward: TokenReward;
  tokenCollat: TokenCollat;
  quarry: QuarryClass;

  constructor(
    mintPubKey: MintPubKey,
    mktTokenArr: { name: string; tokenMarket: TokenMarket }[],
    nameCollat: string,
    platformName: string = "saber",
    tokenReward: TokenReward,
    tokenCollat: TokenCollat
  ) {
    super(POOL_SEED, [mintPubKey.toBuffer()]);

    this.type = "pool";
    // TODO 008: change pool.name to pool.nameCollat
    this.name = nameCollat;
    this.platform = platformName;

    this.oracles = {
      usdc: null as Oracle,
      usdt: null as Oracle,
    };

    this.ataMarketTokens = {
      usdc: null as AtaMarket,
      usdt: null as AtaMarket,
    };

    mktTokenArr.forEach(
      ({ name, tokenMarket }: { name: string; tokenMarket: TokenMarket }) => {
        // set the oracle
        this.oracles[name] = tokenMarket.oracle;
        // set the market token
        this.ataMarketTokens[name] = tokenMarket.ata;
      }
    );

    this.tokenReward = tokenReward;
    this.tokenCollat = tokenCollat;
    this.quarry = new QuarryClass(this.tokenReward, this.tokenCollat);
  }

  /**
   * Create the pool and the quarry for the pool
   */
  public async initPool() {
    await this.quarry.initQuarry();
  }

  /**
   * TODO 013: not complete yet
   * Create the pool on chain via instruction
   */
  public async createPoolOnChain(
    riskLevel,
    debtCeiling: number = DEBT_CEILING_POOL_USDX
  ) {
    const txnCreateUserPool = new web3.Transaction()
      .add
      // programStablePool.instruction.createPool(
      //   this.bump,
      //   new BN(riskLevel),
      //   new BN(1), // TODO: isDual - deprecated
      //   new BN(addZeros(debtCeiling, DECIMALS_USDX)),
      //   platformNameToNumber(this.platform),
      //   this.ataMarketTokens.usdc.mint, // TODO: turn this into an array
      //   this.ataMarketTokens.usdt.mint, // TODO: turn this into an array
      //   /**
      //    * TODO 001: change to rewardTokens[] where each item is a RewardToken instance
      //    *    We need to access [mint, mintAuth, name, etc.] from multiple places
      //    */
      //   this.rewardTokenMints,
      //   this.ataMarketTokens.usdc.tokenADecimals, // TODO: turn this into an array, passed in with the mint addresses
      //   this.ataMarketTokens.usdc.tokenBDecimals, // TODO: turn this into an array, passed in with the mint addresses
      //   {
      //     accounts: {
      //       authority: user.wallet.publicKey,
      //       pool: pool.pubKey,
      //       globalState: accounts.global.pubKey,
      //       mintCollat: accounts.lpSaberUsdcUsdt.mint,

      //       // system accts
      //       systemProgram: SystemProgram.programId,
      //       tokenProgram: TOKEN_PROGRAM_ID,
      //       rent: SYSVAR_RENT_PUBKEY,
      //     },
      //   }
      // )
      ();
  }
}
