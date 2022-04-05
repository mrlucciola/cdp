// anchor/solana
import { Program, Provider, Wallet, workspace } from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
// local
import { GeneralToken, MintPubKey, UserToken } from "../utils/interfaces";
import { airdropSol, createAtaOnChain, mintToAta } from "../utils/fxns";
import { TestTokens } from "../utils/types";
import { StablePool } from "../../target/types/stable_pool";

const programStablePool = workspace.StablePool as Program<StablePool>;

export class User {
  wallet: Wallet;
  provider: Provider;
  tokens?: {
    usdx?: GeneralToken;
    lpSaber?: UserToken; // this doesnt get created until the pass case for vault
    sbr?: UserToken;
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
    console.log("creating token", tokenStr);
    await createAtaOnChain(
      this.wallet,
      this.tokens[tokenStr].ata,
      mintPubKey,
      this.wallet.publicKey,
      this.provider.connection
    );

    // mint
    console.log("minting token", tokenStr);
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
