// libraries
import { workspace, Program, utils, Wallet } from "@project-serum/anchor";
import { PublicKey, Signer } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
// local
import { StablePool } from "../../target/types/stable_pool";
import { ITokenAccount, MintAcct, StateAcct, Vault } from "../utils/interfaces";

const programStablePool = workspace.StablePool as Program<StablePool>;

export class Accounts {
  public global: StateAcct;
  public usdx: MintAcct;
  public lpSaberUsdcUsdt: ITokenAccount;
  constructor() {
    // init global state acct
    this.global = new StateAcct();
    // init usdx mint acct
    this.usdx = new MintAcct();
    // init lp token
    this.lpSaberUsdcUsdt = {
      vault: null as Vault,
      mint: null as PublicKey,
    };
  }
  public async init() {
    // init the token mint
    this.lpSaberUsdcUsdt.mint = await createMint(
      programStablePool.provider.connection,
      (programStablePool.provider.wallet as Wallet).payer as Signer,
      programStablePool.provider.wallet.publicKey,
      null,
      9
    );
    this.lpSaberUsdcUsdt.vault = new Vault(this.lpSaberUsdcUsdt.mint);
  }
}
