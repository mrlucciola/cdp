// libraries
import { Program, web3, workspace, Wallet } from "@project-serum/anchor";
import { PublicKey, Transaction, Connection } from "@solana/web3.js";
// TODO: fix saber linter issue
import {
  // @ts-ignore
  createAssociatedTokenAccountInstruction,
  // @ts-ignore
  mintTo,
} from "@solana/spl-token";
// local
import { StablePool } from "../../target/types/stable_pool";
import { getAcctBalance, getAssocTokenAcct, handleTxn } from "../utils/fxns";
import { ATA, MintPubKey, USDx, User, UserToken } from "../utils/interfaces";
import baseKeyArr from "../../.config/testUser-base-keypair.json";
import { userTestKeypair } from "../../.config/testUser-test";
import { userOracleReporterKeypair } from "../../.config/testUser-oracleReporter";
import { DECIMALS_USDCUSDT } from "../utils/constants";
import { TestTokens } from "../utils/types";

const programStablePool = workspace.StablePool as Program<StablePool>;

// will repeat what was done for super, for user
const userBaseKeypair: web3.Keypair = web3.Keypair.fromSecretKey(
  new Uint8Array(baseKeyArr as any[])
);
export const createAtaOnChain = async (
  userWallet: Wallet,
  ata: ATA,
  mintPubKey: MintPubKey,
  auth?: PublicKey,
  userConnection: Connection = null
) => {
  const txn = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      userWallet.publicKey, // payer: web3.PublicKey,
      ata.pubKey, // associatedToken: web3.PublicKey,
      auth || userWallet.publicKey, // owner: web3.PublicKey,
      mintPubKey // mint: web3.PublicKey,
    )
  );
  userConnection && (await handleTxn(txn, userConnection, userWallet));
};

/**
 * Create an associated token account (ATA) for a given user-auth account.
 *
 * 1. Derive the ATA.
 * 2. Create the ATA on chain
 * 3. Mint token to the ATA
 *
 * @param userWallet
 * @param userConnection
 * @param mintPubKey - the mint pub key
 * @param authorityPubKey - the authority
 */
export const deriveAndInitAta = async (
  userWallet: Wallet,
  userConnection: Connection,
  mintPubKey: PublicKey,
  authorityPubKey?: PublicKey
): Promise<[PublicKey, number]> => {
  const auth = authorityPubKey || userWallet.publicKey;
  // 1) get token acct for user
  const [ataPubKey, bump] = getAssocTokenAcct(auth, mintPubKey);

  // create instruction & add to transaction
  const txn = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      userWallet.publicKey, // payer: web3.PublicKey,
      ataPubKey, // associatedToken: web3.PublicKey,
      auth, // owner: web3.PublicKey,
      mintPubKey // mint: web3.PublicKey,
    )
  );

  // sign and send
  await handleTxn(txn, userConnection, userWallet);
  return [ataPubKey, bump];
};

export const mintToAta = async (
  mintTokenStr: TestTokens,
  mintPubKey: PublicKey,
  mintAuth: User,
  dest: UserToken | USDx,
  amount: number = 200_000_000 // 0.2 units of token
) => {
  // mint to newly created ata
  const ataBalanceOrig = Number((await getAcctBalance(dest.ata.pubKey)).amount);
  console.log(`minting ${mintTokenStr} to ata, balance: ${ataBalanceOrig}`);
  try {
    await mintTo(
      mintAuth.provider.connection, // connection — Connection to use
      mintAuth.wallet.payer, // payer — Payer of the transaction fees
      mintPubKey, // mint — Mint for the account
      dest.ata.pubKey, // destination — Address of the account to mint to
      mintAuth.wallet.publicKey, // authority — Minting authority
      amount // amount — Amount to mint
    );
  } catch (error) {
    throw error;
  }
  const ataBalanceNew = Number((await getAcctBalance(dest.ata.pubKey)).amount);
  const diff = ataBalanceNew - ataBalanceOrig;
  console.log(`ata balance: ${ataBalanceOrig} -> ${ataBalanceNew}  ∆=${diff}`);
};

export class Users {
  public base: User;
  public test: User;
  public super: User;
  public oracleReporter: User;

  constructor() {
    this.base = new User(userBaseKeypair);
    this.test = new User(userTestKeypair);
    this.oracleReporter = new User(userOracleReporterKeypair);
    this.super = {
      wallet: programStablePool.provider.wallet as Wallet,
      provider: programStablePool.provider,
      init: null,
      addToken: null,
    };
  }
  public async init(mintUsdxPubKey: PublicKey, mintPubKey: PublicKey) {
    await this.base.init();
    await this.base.addToken(
      mintPubKey,
      "lpSaber",
      2000 * 10 ** DECIMALS_USDCUSDT
    );
    this.base.tokens.usdx = new USDx(this.base.wallet, mintUsdxPubKey);
    await this.test.init();
    await this.test.addToken(mintPubKey, "lpSaber", 200_000_000);
    this.test.tokens.usdx = new USDx(this.test.wallet, mintUsdxPubKey);
    await this.oracleReporter.init();
  }
}
