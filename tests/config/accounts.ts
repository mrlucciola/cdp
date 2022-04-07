// libraries
import { workspace, Program, Wallet } from "@project-serum/anchor";
import { Keypair, PublicKey, Signer } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// @ts-ignore
import { mintTo } from "@solana/spl-token";
// utils
import {
  findMinterAddress,
  QuarrySDK,
  QUARRY_ADDRESSES,
} from "@quarryprotocol/quarry-sdk";
import {
  SignerWallet,
  Provider as SaberProvider,
} from "@saberhq/solana-contrib";
import {
  TokenAmount,
  Token as SToken,
  createInitMintInstructions,
  u64,
  SPLToken,
} from "@saberhq/token-utils";
// local
import { StablePool } from "../../target/types/stable_pool";
import {
  MarketTokenAccount,
  CollateralAccount,
  MintAcct,
  MintPubKey,
  GlobalStateAcct,
  Pool,
  ATA,
  QuarryClass,
  RewardTokenAccount,
} from "../utils/interfaces";
// local
import {
  DECIMALS_SBR,
  DECIMALS_USDCUSDT,
  DECIMALS_USDC,
  DECIMALS_USDT,
  DECIMALS_PRICE,
} from "../utils/constants";
import { createAtaOnChain } from "../utils/fxns";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

export class Accounts {
  public global: GlobalStateAcct;
  public usdx: MintAcct;
  public sbr: RewardTokenAccount;
  public lpSaberUsdcUsdt: CollateralAccount;
  public usdc: MarketTokenAccount;
  public usdt: MarketTokenAccount;

  public quarry: QuarryClass;

  constructor() {
    // init global state acct
    this.global = new GlobalStateAcct();
    // init usdx mint acct
    this.usdx = new MintAcct();
    this.usdc = new MarketTokenAccount();
    this.usdt = new MarketTokenAccount();
    this.sbr = new RewardTokenAccount(); // rewardsMintKP.publicKey,
    // init lp token
    this.lpSaberUsdcUsdt = {
      pool: null as Pool,
      mint: null as PublicKey,
    };
  }
  public async init() {
    // init the token mint, oracle and markettoken
    await this.sbr.init(DECIMALS_SBR);
    await this.usdc.init(
      1.03 * 10 ** DECIMALS_PRICE,
      25331785.961795 * 10 ** DECIMALS_USDC,
      DECIMALS_USDC
    ); // amount found on explorer.solana.com on 3/24/22 5:15pm EST
    await this.usdt.init(
      0.97 * 10 ** DECIMALS_PRICE,
      16555962.623743 * 10 ** DECIMALS_USDT,
      DECIMALS_USDT
    ); // amount found on explorer.solana.com on 3/24/22 5:15pm EST

    // init the collateral mint
    this.lpSaberUsdcUsdt.mint = (
      await SPLToken.createMint(
        programStablePool.provider.connection,
        (programStablePool.provider.wallet as Wallet).payer as Signer,
        programStablePool.provider.wallet.publicKey,
        null,
        DECIMALS_USDCUSDT,
        TOKEN_PROGRAM_ID
      )
    ).publicKey as MintPubKey;

    const lpATASuper = new ATA(
      programStablePool.provider.wallet.publicKey,
      this.lpSaberUsdcUsdt.mint
    );
    // create an ata for the collateral mint
    await createAtaOnChain(
      programStablePool.provider.wallet as Wallet,
      lpATASuper,
      this.lpSaberUsdcUsdt.mint,
      programStablePool.provider.wallet.publicKey,
      programStablePool.provider.connection
    );

    await mintTo(
      programStablePool.provider.connection, // connection — Connection to use
      // @ts-ignore
      programStablePool.provider.wallet.payer, // payer — Payer of the transaction fees
      this.lpSaberUsdcUsdt.mint, // mint — Mint for the account
      lpATASuper.pubKey, // destination — Address of the account to mint to
      programStablePool.provider.wallet.publicKey, // authority — Minting authority
      40262269.031312 * 10 ** DECIMALS_USDCUSDT // mintAmount — Amount to mint in human form
    );
    this.lpSaberUsdcUsdt.pool = new Pool(
      this.lpSaberUsdcUsdt.mint,
      this.usdc,
      this.usdt
    );
    this.quarry = new QuarryClass();
    await this.quarry.init(this.sbr, this.lpSaberUsdcUsdt);
  }
  
}
