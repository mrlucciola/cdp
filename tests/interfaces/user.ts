// anchor/solana
import { Program, Provider, Wallet, workspace } from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
// local
import { airdropSol } from "../utils/fxns";
import { StablePool } from "../../target/types/stable_pool";
import { UserState } from "./userState";
import { TokenCollatUser } from "./TokenCollatUser";
import { TokenReward, TokenRewardUser } from "./TokenReward";
import { TokenPDAUser } from "./TokenPDA";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

export class User {
  wallet: Wallet;
  provider: Provider;
  tokens?: {
    usdx?: TokenPDAUser;
    lpSaber?: TokenCollatUser; // this doesnt get created until the pass case for vault
    sbr?: TokenRewardUser;
  };
  userState: UserState;
  name: string;

  constructor(keypair: Keypair, nameUser: string) {
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

    this.userState = new UserState(this);
    this.name = nameUser;
  }

  /**
   * Initialize acct, airdrop
   */
  public async initUser() {
    await airdropSol(
      this.provider,
      this.wallet.publicKey,
      99999 * LAMPORTS_PER_SOL
    );
  }

  public async addTokenReward(tokenReward: TokenReward) {
    this.tokens[tokenReward.nameToken] = tokenReward as TokenReward;
    await (this.tokens[tokenReward.nameToken] as TokenReward).initTokenReward();
  }
}
