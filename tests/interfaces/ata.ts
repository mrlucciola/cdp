// anchor/solana
import { Program, Wallet, workspace } from "@project-serum/anchor";
import { AccountInfo, PublicKey } from "@solana/web3.js";
// TODO: figure out why linter throws error. It is because of quarry's package
import {
  // @ts-ignore
  mintTo,
  // @ts-ignore
  burn,
} from "@solana/spl-token";
import { User } from "../interfaces/user";
import { getAssocTokenAcct } from "../utils/fxns";
import { Acct, MintPubKey } from "../utils/interfaces";
import { StablePool } from "../../target/types/stable_pool";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

/**
 * Associated Token Account
 * @property pubKey - PublicKey: Public Key for ATA
 * @property bump? - u8: Bump/nonce for ATA
 */
export class ATA {
  bump?: number;
  /**  The public key of the mint account */
  mint: MintPubKey;
  /** The name of the token */
  nameToken?: string;
  /** The identifier of this class instance */
  name?: string;
  pubKey: PublicKey;

  constructor(
    authorityPubKey: PublicKey,
    mintPubKey: MintPubKey,
    nameToken?: string,
    authName?: string
  ) {
    const [ataPubKey, ataBump] = getAssocTokenAcct(authorityPubKey, mintPubKey);

    this.pubKey = ataPubKey;
    this.bump = ataBump;
    this.mint = mintPubKey;
    this.nameToken = nameToken;
    // this.name = `${authName}-ata-${nameToken}`;
  }

  public async getBalance(
    program: Program<any> = programStablePool as Program<StablePool>
  ) {
    return await program.provider.connection.getTokenAccountBalance(
      this.pubKey
    );
  }

  /**
   * Get system account info for this address
   * @returns Object
   */
  public async getAccountInfo(): Promise<AccountInfo<Buffer>> {
    return await programStablePool.provider.connection.getAccountInfo(
      this.pubKey
    );
  }

  /**
   * Mint token to this a.t.a. for testing purposes
   * If a.t.a. doesnt exist, create it
   * @param mintAmount
   * @param mintAuth
   * @param mintPubKey
   */
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
