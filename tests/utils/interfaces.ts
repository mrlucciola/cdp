// anchor/solana
import {
  Provider,
  utils,
  Wallet,
  web3,
  workspace,
  Program,
} from "@project-serum/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
} from "@solana/web3.js";
// TODO: figure out why linter throws error. It is because of quarry's package
import {
  // @ts-ignore
  mintTo,
  // @ts-ignore
  burn,
  // @ts-ignore
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// local
import {
  GLOBAL_STATE_SEED,
  MINT_USDX_SEED,
  ORACLE_SEED,
  TROVE_SEED,
  VAULT_SEED,
} from "./constants";
import { StablePool } from "../../target/types/stable_pool";
import { airdropSol, getAssocTokenAcct, getPda } from "./fxns";
import { TestTokens } from "./types";
import { createAtaOnChain, mintToAta } from "../config/users";
import { SPLToken } from "@saberhq/token-utils";

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

/**
 * Program Derived Address
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce for ATA
 */
export class PDA extends Acct {
  bump: number;
}

/**
 * Associated Token Account
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce for ATA
 */
export class ATA extends Acct {
  bump?: number;

  constructor(authorityPubKey: PublicKey, mintPubKey: MintPubKey) {
    super();

    const [ataPubKey, ataBump] = getAssocTokenAcct(authorityPubKey, mintPubKey);
    this.pubKey = ataPubKey;
    this.bump = ataBump;
  }
  public async getBalance() {
    return await programStablePool.provider.connection.getTokenAccountBalance(
      this.pubKey
    );
  }
  public async mintToATA(
    mintAmount: number,
    mintAuth: User,
    mintPubKey: MintPubKey
  ) {
    await mintTo(
      mintAuth.provider.connection, // connection — Connection to use
      mintAuth.wallet.payer, // payer — Payer of the transaction fees
      mintPubKey, // mint — Mint for the account
      this.pubKey, // destination — Address of the account to mint to
      mintAuth.wallet.publicKey, // authority — Minting authority
      mintAmount // mintAmount — Amount to mint
    );
  }
  /**
   * after a test ends, it can be useful to burn tokens
   *  to reset the balance for the next test.
   *
   * Setting burn amount to -1 will burn all tokens
   */
  public async burnTokens(
    burnAmount: number,
    mintAuth: User,
    mintPubKey: MintPubKey,
    userWallet: Wallet
  ) {
    // check if -1, then get the total amount in account
    const amtToBurn = (
      burnAmount === -1 ? (await this.getBalance()).value.amount : burnAmount
    ) as number;
    if (amtToBurn === 0) return;

    // send burn txn
    await burn(
      mintAuth.provider.connection, // connection
      userWallet.payer, // payer
      this.pubKey, // account: acct to burn tokens from
      mintPubKey, // mint: the token mint
      userWallet.publicKey, // owner: Account owner
      amtToBurn // amount: Amt of token to burn
    );
  }
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
 * User Token object
 * Contains an ATA and a Trove
 * @class ATA
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce for ATA
 * @class Trove
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump - u8: Bump/nonce for ATA
 * @property ATA
 * @method getAccountInfo
 */
export class UserToken {
  ata: ATA;
  trove: Trove;
  constructor(userWallet: Wallet, mintPubKey: MintPubKey) {
    this.ata = new ATA(userWallet.publicKey, mintPubKey);
    this.trove = new Trove(userWallet, mintPubKey);
  }

  // TODO: this method throws an error, havent debugged yet
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

export class WalletKeypair extends Keypair {}

export class MintPubKey extends PublicKey {}

export class TokenAccPubKey extends PublicKey {}

export interface CollateralAccount {
  mint: MintPubKey;
  vault: Vault;
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
 * Trove
 * Just a public key
 * @property pubKey - PublicKey: Public Key for account
 * @property bump - u8: Bump/nonce
 * @method getAccountInfo - gets account state information on chain
 */
export class Trove extends BaseAcct {
  ata: ATA;
  ataRewards: ATA[];
  constructor(userWallet: Wallet, mintPubKey: MintPubKey, rewardMints = []) {
    super(TROVE_SEED, [mintPubKey.toBuffer(), userWallet.publicKey.toBuffer()]);
    this.type = "trove";

    // get ata info
    this.ata = new ATA(this.pubKey, mintPubKey);
    this.ataRewards = rewardMints.map((mint) => new ATA(this.pubKey, mint));
  }
  // public async getAccount(): Promise<IdlAccounts<StablePool>["trove"]> {
  //   return await this.getAccount();
  // }
}

// TODO: is this MVP?
export class Miner {
  pubkey: PublicKey;
  bump: number;
  ata: ATA;
  constructor(trove: Trove, quarryKey: PublicKey, mintKey: MintPubKey) {
    const [pubkey, bump] = getPda(
      [
        Buffer.from(utils.bytes.utf8.encode("Miner")),
        quarryKey.toBuffer(),
        trove.pubKey.toBuffer(),
      ],
      QUARRY_ADDRESSES.Mine
    );
    this.pubkey = pubkey;
    this.bump = bump;
    // [this.pubkey, this.bump] = findProgramAddressSync(
    //   [
    //     Buffer.from(utils.bytes.utf8.encode("Miner")),
    //     quarryKey.toBytes(),
    //     trove.pubKey.toBytes(),
    //   ],
    //   QUARRY_ADDRESSES.Mine
    // );
    this.ata = new ATA(this.pubkey, mintKey);
  }
}

export class GlobalStateAcct extends BaseAcct {
  constructor() {
    super(GLOBAL_STATE_SEED, []);
    this.type = "globalState";
  }
  // public async getAccount(): Promise<IdlAccounts<StablePool>["trove"]> {
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
export class Vault extends BaseAcct {
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
    super(VAULT_SEED, [mintPubKey.toBuffer()]);
    this.type = "vault";

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
  // public async getAccount(): Promise<IdlAccounts<StablePool>["vault"]> {
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

export class User {
  wallet: Wallet;
  provider: Provider;
  tokens?: {
    usdx?: USDx;
    lpSaber?: UserToken; // this doesnt get created until the pass case for trove
    ataSBRKey?: PublicKey;
  };
  miner?: any;
  constructor(keypair: Keypair) {
    this.wallet = new Wallet(keypair);
    this.provider = new Provider(
      programStablePool.provider.connection,
      this.wallet,
      {
        skipPreflight: true,
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      }
    );
    // TODO: was this commented out?
    this.tokens = {};
  }
  public async init() {
    await airdropSol(
      this.provider,
      this.wallet.publicKey,
      99999 * LAMPORTS_PER_SOL
    );
    // await this.addToken("base", mintPubKey, "lpSaber", 200_000_000);
  }
  public async addToken(
    mintPubKey: MintPubKey,
    tokenStr: TestTokens,
    amount: number,
    mintAuth?: User
  ) {
    if (amount === 0) throw new Error("Please enter more than 0");
    this.tokens[tokenStr] = new UserToken(this.wallet, mintPubKey);

    // create ata
    await createAtaOnChain(
      this.wallet,
      this.tokens[tokenStr].ata,
      mintPubKey,
      this.wallet.publicKey,
      this.provider.connection
    );

    // mint
    if (mintAuth) {
      await mintToAta(
        tokenStr,
        mintPubKey,
        mintAuth,
        this.tokens[tokenStr],
        amount
      );
    }
  }
}
