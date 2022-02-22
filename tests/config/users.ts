// libraries
import {
  getProvider,
  IdlAccounts,
  Program,
  Provider,
  web3,
  workspace,
  Wallet,
  SplToken,
} from "@project-serum/anchor";
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
// local
// import superKeyArr from "../../.config/testUser-super-keypair.json";
import baseKeyArr from "../../.config/testUser-base-keypair.json";
import { StablePool } from "../../target/types/stable_pool";
import * as constants from "../utils/constants";
import {
  airdropSol,
  derivePdaAsync,
  getAcctBalance,
  getAssocTokenAcct,
  getPda,
  getSolBalance,
  handleTxn,
} from "../utils/fxns";
import { Accounts, Vault } from "./accounts";
// import { userb } from "../../.config/testUser-super";

const programStablePool = workspace.StablePool as Program<StablePool>;

// will repeat what was done for super, for user
const userBaseKeypair: web3.Keypair = web3.Keypair.fromSecretKey(
  new Uint8Array(baseKeyArr as any[])
);
export interface Addr {
  pubKey: PublicKey;
}
export interface PDA extends Addr {
  bump: number;
}
export interface Trove extends PDA {}
/**
 * Associated Token Account
 * @param pubKey - PublicKey: Public Key for ATA
 * @param bump - u8: Bump/nonce
 */
export interface ATA extends Addr {
  bump?: number;
}

export interface UserToken {
  ata: ATA;
  trove: Trove;
}
const emptyPda: PDA = {
  pubKey: null as PublicKey,
  bump: null as number,
};
export interface User {
  wallet: Wallet; // prev: userCollKey
  provider: Provider;
  tokens?: {
    usdx?: UserToken;
    lpSaber?: UserToken; // this doesnt get created until the pass case for trove
  };
}

// @ts-ignore
export const usersObj: Users = {
  base: {
    wallet: new Wallet(userBaseKeypair), // prev: userCollKey
    provider: new Provider(
      programStablePool.provider.connection,
      new Wallet(userBaseKeypair),
      {
        skipPreflight: true,
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      }
    ),
  },
  super: {
    wallet: programStablePool.provider.wallet as Wallet,
    provider: programStablePool.provider,
  },
  addToken: null as any,
};
type UsersType = "base" | "super";
type tokens = "usdx" | "lpSaber";

/**
 * Create an associated token account (ATA) for a given user-auth account.
 *
 * 1. Derive the ATA.
 * 2. Create the ATA on chain
 * 3. Mint token to the ATA
 *
 * @param user
 * @param mintSuper - the mint authority's wallet
 * @param mintToken - the
 */
const deriveAndInitAta = async (
  user: User,
  mintPubKey: PublicKey
): Promise<[PublicKey, number]> => {
  if (
    user.wallet.publicKey.toString() !==
    user.provider.wallet.publicKey.toString()
  )
    throw new Error("Provider user != wallet user");

  // 1) get token acct for user
  console.log(mintPubKey.toString());
  // TODO: DERIVE ATA USING getAssocTokenAcct() - this is a deterministic and preferred way of deriving the pda.
  const [ata, bump] = getAssocTokenAcct(user.wallet.publicKey, mintPubKey);
  console.log("mint token", mintPubKey.toString());
  console.log(`expected ata:`, ata.toString());
  console.log("base user", user.wallet.publicKey.toString());

  // create instruction & add to transaction
  const txn = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      user.wallet.publicKey, // payer: web3.PublicKey,
      ata, // associatedToken: web3.PublicKey,
      user.wallet.publicKey, // owner: web3.PublicKey,
      mintPubKey // mint: web3.PublicKey,
    )
  );

  // prep txn
  txn.feePayer = user.wallet.publicKey;
  try {
    txn.recentBlockhash = (
      await user.provider.connection.getLatestBlockhash()
    ).blockhash;
  } catch (error) {
    return error;
  }

  // send txn
  try {
    const signedTxn: Transaction = await user.wallet.signTransaction(txn);
    const receipt: string = await user.provider.send(signedTxn);
    const confirmation: web3.RpcResponseAndContext<web3.SignatureResult> =
      await user.provider.connection.confirmTransaction(receipt);

    console.log("resMain", receipt);
    console.log("confirmation", confirmation);
  } catch (error) {
    console.log("\nsending txn err: ", error);
    throw error;
  }
  return [ata, bump];
};

export const mintToAta = async (
  mintTokenStr: tokens,
  mintPubKey: PublicKey,
  mintAuth: User,
  destination: UserToken,
  amount: number = 200_000_000 // 0.2 units of token
) => {
  // mint to newly created ata
  const ataBalanceOrig = Number(
    (await getAcctBalance(destination.ata.pubKey)).amount
  );
  console.log(`minting ${mintTokenStr} to ata, balance: ${ataBalanceOrig}`);
  try {
    await mintTo(
      mintAuth.provider.connection, // connection — Connection to use
      mintAuth.wallet.payer, // payer — Payer of the transaction fees
      mintPubKey, // mint — Mint for the account
      destination.ata.pubKey, // destination — Address of the account to mint to
      mintAuth.wallet.publicKey, // authority — Minting authority
      amount // amount — Amount to mint
      // [], // multiSigners — Signing accounts if authority is a multisig
      // , // confirmOptions — Options for confirming the transaction
      // , // programId — SPL Token program account
    );
  } catch (error) {
    throw error;
  }
  const ataBalanceNew = Number(
    (await getAcctBalance(destination.ata.pubKey)).amount
  );
  const diff = ataBalanceNew - ataBalanceOrig;
  console.log(`ata balance: ${ataBalanceOrig} -> ${ataBalanceNew} ∆=${diff}`);
};

export class Users {
  public base: User;
  public super: User;

  constructor() {
    this.base = {
      wallet: new Wallet(userBaseKeypair), // prev: userCollKey
      provider: new Provider(
        programStablePool.provider.connection,
        new Wallet(userBaseKeypair),
        {
          skipPreflight: true,
          commitment: "confirmed",
          preflightCommitment: "confirmed",
        }
      ),
      tokens: {},
    };
    this.super = {
      wallet: programStablePool.provider.wallet as Wallet,
      provider: programStablePool.provider,
    };
  }
  public async init(mintPubKey: PublicKey) {
    await airdropSol(
      this.super.provider,
      this.super.wallet.publicKey,
      99999 * LAMPORTS_PER_SOL
    );
    await airdropSol(
      this.base.provider,
      this.base.wallet.publicKey,
      99999 * LAMPORTS_PER_SOL
    );
    // await this.addToken("base", mintUsdxPubKey, "usdx", 500_000_000_000, false);
    await this.addToken("base", mintPubKey, "lpSaber", 200_000_000);
  }

  public async addToken(
    userStr: UsersType,
    mintPubKey: PublicKey,
    tokenStr: tokens,
    amount: number = 200_000_000,
    isMintActive: boolean = true
  ) {
    if (amount === 0) throw new Error("Please enter more than 0");
    const user = this[userStr] as User;
    user.tokens[tokenStr] = {} as UserToken;

    // create ata
    const [ata, bump] = await deriveAndInitAta(user, mintPubKey);
    user.tokens[tokenStr].ata = { pubKey: ata, bump };

    // mint
    if (!isMintActive) return;
    await mintToAta(
      tokenStr,
      mintPubKey,
      this.super,
      user.tokens[tokenStr],
      amount
    );
  }
  /**
   * createTrove NOT COMPLETE
   */
  public async createTrove(vault: Vault, user: User) {
    const seeds = [
      Buffer.from(constants.TROVE_SEED),
      vault.pubKey.toBuffer(),
      user.wallet.publicKey.toBuffer(),
    ];
    getPda(seeds, programStablePool.programId);
  }
}

/**
 * create usdx and assign to state var
 * @param mintPubKey
 * @param user
 */
export const deriveUsdxAcct = async (mintPubKey: PublicKey, user: User) => {
  const [userUsdxKey, userUsdxBump] = getAssocTokenAcct(
    user.wallet.publicKey,
    mintPubKey
  );
  // add to state
  user.tokens.usdx.ata = { pubKey: userUsdxKey, bump: userUsdxBump };
};
