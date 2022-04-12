// anchor/solana
import { Wallet, web3, workspace, Program } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey, Signer } from "@solana/web3.js";
// TODO: figure out why linter throws error. It is because of quarry's package
import {
  // @ts-ignore
  mintTo,
  // @ts-ignore
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  findMinterAddress,
  QuarrySDK,
  QuarryWrapper,
  RewarderWrapper,
  QUARRY_ADDRESSES,
} from "@quarryprotocol/quarry-sdk";
import {
  TokenAmount,
  Token as SToken,
  u64,
  SPLToken,
} from "@saberhq/token-utils";
import {
  SignerWallet,
  Provider as SaberProvider,
} from "@saberhq/solana-contrib";
// local
import {
  GLOBAL_STATE_SEED,
  MINT_USDX_SEED,
  ORACLE_SEED,
  VAULT_SEED,
  POOL_SEED,
  DECIMALS_SBR,
} from "./constants";
import { StablePool } from "../../target/types/stable_pool";
import { getPda, createAtaOnChain } from "./fxns";
import { ATA } from "../interfaces/ata";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * Base Account
 * Just a public key
 * @property pubKey - PublicKey: Public Key for account
 */
export class Acct {
  pubKey: PublicKey;

  /**
   * Get system account info for this address
   * @returns Object
   */
  public async getAccountInfo(): Promise<web3.AccountInfo<Buffer>> {
    return await programStablePool.provider.connection.getAccountInfo(
      this.pubKey
    );
  }
}

export class Market {
  saber?: {
    usdcUsdtStable?: GeneralToken;
  };
}

export class MarketTokenAccount {
  splToken: SPLToken;
  mint: MintPubKey;
  /// oracle account
  oracle: Oracle;
  markets: { saber: { usdcUsdtStable: { ata: ATA } } };
  constructor() {}

  // TODO: need to check if decimal = 0 there is an issue
  public async init(
    initPrice: number,
    startingToken: number = 0,
    decimals: number = 0
  ) {
    if (startingToken > 0 && decimals === 0)
      throw Error("Decimals cant be zero");
    this.splToken = await SPLToken.createMint(
      programStablePool.provider.connection,
      (programStablePool.provider.wallet as Wallet).payer as Signer,
      programStablePool.provider.wallet.publicKey,
      null,
      decimals,
      TOKEN_PROGRAM_ID
    );
    this.mint = this.splToken.publicKey;
    this.oracle = new Oracle(this.mint, initPrice);
    this.markets = {
      saber: {
        usdcUsdtStable: {
          ata: new ATA(
            // this might not the best addr to use for the ATA but it works for now
            programStablePool.provider.wallet.publicKey,
            this.mint
          ) as AtaMarketToken,
        },
      },
    };
    // init the ATA on chain
    await createAtaOnChain(
      programStablePool.provider.wallet as Wallet,
      this.markets.saber.usdcUsdtStable.ata,
      this.mint,
      programStablePool.provider.wallet.publicKey,
      programStablePool.provider.connection
    );
    // // mint init token to populate for lp price calcs
    if (startingToken > 0) {
      await mintTo(
        programStablePool.provider.connection, // connection — Connection to use
        // @ts-ignore
        programStablePool.provider.wallet.payer, // payer — Payer of the transaction fees
        this.mint, // mint — Mint for the account
        this.markets.saber.usdcUsdtStable.ata.pubKey, // destination — Address of the account to mint to
        programStablePool.provider.wallet.publicKey, // authority — Minting authority
        startingToken // mintAmount — Amount to mint in human form
      );
    }
  }
}

export class RewardTokenAccount {
  splToken: SPLToken;
  mint: MintPubKey;

  async init(decimals: number) {
    this.splToken = await SPLToken.createMint(
      programStablePool.provider.connection,
      (programStablePool.provider.wallet as Wallet).payer as Signer,
      programStablePool.provider.wallet.publicKey,
      programStablePool.provider.wallet.publicKey,
      decimals,
      TOKEN_PROGRAM_ID
    );
    this.mint = this.splToken.publicKey;
  }
}

/**
 * Program Derived Address
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce for ATA
 */
export class PDA extends Acct {
  bump: number;
}

/**
 * Token Account
 * @property bump? - u8: Bump/nonce
 */
export class TokenAcc extends Acct {
  bump?: number;

  constructor(tokenAccountPubkey: PublicKey) {
    super();
    this.pubKey = tokenAccountPubkey;
  }
  public async getTokenAccount() {
    return await getAccount(programStablePool.provider.connection, this.pubKey);
  }
  public async getBalance() {
    return await programStablePool.provider.connection.getTokenAccountBalance(
      this.pubKey
    );
  }
}

export class USDx {
  ata: ATA;
  constructor(userWallet: Wallet, mintPubKey: MintPubKey) {
    this.ata = new ATA(userWallet.publicKey, mintPubKey);
  }
}

/**
 * General token
 * Contains an ATA and a Vault
 * @class ATA
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce for ATA
 * @method getAccountInfo
 */
export class GeneralToken {
  mint: MintPubKey;
  ata: ATA;
  constructor(userWallet: Wallet, mintPubKey: MintPubKey) {
    this.ata = new ATA(userWallet.publicKey, mintPubKey);
    this.mint = mintPubKey;
  }

  public async initAta(
    userWallet: Wallet,
    mintPubKey: MintPubKey,
    userConnection: Connection
  ) {
    await createAtaOnChain(
      userWallet, // user wallet
      this.ata, // assoc token acct
      mintPubKey, // mint pub key
      userWallet.publicKey, // auth, can be different than payer
      userConnection // connection
    );
  }
}

/**
 * User Token object
 * Contains an ATA and a Vault
 * @class ATA
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce for ATA
 * @class Vault
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump - u8: Bump/nonce for ATA
 * @property ATA
 * @method getAccountInfo
 */
export class UserToken extends GeneralToken {
  vault: Vault;
  constructor(userWallet: Wallet, mintPubKey: MintPubKey) {
    super(userWallet, mintPubKey);

    this.ata = new ATA(userWallet.publicKey, mintPubKey);
    this.vault = new Vault(userWallet, mintPubKey);
  }
}

export class WalletKeypair extends Keypair {}

export class MintPubKey extends PublicKey {}

export class TokenAccPubKey extends PublicKey {}

export interface CollateralAccount {
  mint: MintPubKey;
  pool: Pool;
}

/**
 * BaseAcct - a PDA with get-account method
 */
export class BaseAcct extends PDA {
  type: string;

  /**
   * Get account state for this address
   * @returns IdlAccounts<StablePool>["<type of account>"]
   */
  public async getAccount(): Promise<any> {
    return await programStablePool.account[this.type].fetch(this.pubKey);
  }

  constructor(constant: string, seedsArr: Buffer[]) {
    super();
    const [pubkey, bump] = getPda(
      [Buffer.from(constant), ...seedsArr],
      programStablePool.programId
    );
    this.pubKey = pubkey;
    this.bump = bump;
  }
}

/**
 * Vault
 * Just a public key
 * @property pubKey - PublicKey: Public Key for account
 * @property bump - u8: Bump/nonce
 * @method getAccountInfo - gets account state information on chain
 */
export class Vault extends BaseAcct {
  ata: ATA;
  ataRewards: ATA[];

  constructor(userWallet: Wallet, mintPubKey: MintPubKey, rewardMints = []) {
    super(VAULT_SEED, [mintPubKey.toBuffer(), userWallet.publicKey.toBuffer()]);
    this.type = "vault";

    // get ata info
    this.ata = new ATA(this.pubKey, mintPubKey);
    this.ataRewards = rewardMints.map((mint) => new ATA(this.pubKey, mint));
  }
}

// TODO: is this MVP?

export class GlobalStateAcct extends BaseAcct {
  constructor() {
    super(GLOBAL_STATE_SEED, []);
    this.type = "globalState";
  }
  // public async getAccount(): Promise<IdlAccounts<StablePool>["vault"]> {
  //   return await this.getAccount();
  // }
}
export class MintAcct extends BaseAcct {
  constructor() {
    super(MINT_USDX_SEED, []);
    this.type = "mint";
  }
}

/**
 * Associated Token Account - specifically for market tokens
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce for ATA
 */
export class AtaMarketToken extends ATA {}
export class Pool extends BaseAcct {
  oracles: {
    usdc: Oracle;
    usdt: Oracle;
  };
  ataMarketTokens: {
    usdc: AtaMarketToken;
    usdt: AtaMarketToken;
  };
  constructor(
    mintPubKey: MintPubKey,
    mktTokenUsdc: MarketTokenAccount,
    mktTokenUsdt: MarketTokenAccount
  ) {
    super(POOL_SEED, [mintPubKey.toBuffer()]);
    this.type = "pool";

    // add seed oracles
    this.oracles = {
      usdc: mktTokenUsdc.oracle,
      usdt: mktTokenUsdt.oracle,
    };
    this.ataMarketTokens = {
      usdc: mktTokenUsdc.markets.saber.usdcUsdtStable.ata,
      usdt: mktTokenUsdt.markets.saber.usdcUsdtStable.ata,
    };
  }
  // public async getAccount(): Promise<IdlAccounts<StablePool>["pool"]> {
  //   return await this.getAccount();
  // }
}

/**
 * Oracle <- this is incorrectly named. Should be Oracle
 * @property mint - PublicKey: Public Key for token mint
 * @property price - price for this feed - jkap: dont think we need price
 * @property type
 */
export class Oracle extends BaseAcct {
  mint: MintPubKey;
  price: number;
  // jkap - i dont think we need price
  constructor(mint: MintPubKey, price: number) {
    super(ORACLE_SEED, [mint.toBuffer()]);
    this.type = "oracle";
    this.mint = mint;
    // jkap - i dont think we need price
    this.price = price;
  }
}
