// solana/anchor
import { BN, Program, web3, workspace } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// local
import { StablePool } from "../../target/types/stable_pool";
// utils
import {
  DEBT_CEILING_GLOBAL_USDX,
  DEBT_CEILING_USER_USDX,
  DECIMALS_USD,
  DECIMALS_USDX,
  GLOBAL_STATE_SEED,
  TVL_LIMIT_USD,
} from "../utils/constants";
import { handleTxn } from "../utils/fxns";
// interfaces
import { BaseAcct } from "../utils/interfaces";
import { TokenPda } from "./TokenPDA";
import { User } from "./user";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

export class GlobalState extends BaseAcct {
  usdx: TokenPda;
  oracleReporter: User;

  constructor(usdx: TokenPda, oracleReporter: User) {
    super(GLOBAL_STATE_SEED, []);
    this.type = "globalState";
    this.usdx = usdx;
    this.oracleReporter = oracleReporter;
  }

  // public async getAccount(): Promise<IdlAccounts<StablePool>["vault"]> {
  //   return await this.getAccount();
  // }

  public async initGlobalState(userSuper: User) {
    // create txn
    const txn = new web3.Transaction();
    // add instruction
    txn.add(
      programStablePool.instruction.createGlobalState(
        // TODO: remove
        this.bump,
        // TODO: remove
        this.usdx.bump,
        new BN(TVL_LIMIT_USD * 10 ** DECIMALS_USD),
        new BN(DEBT_CEILING_GLOBAL_USDX * 10 ** DECIMALS_USDX),
        new BN(DEBT_CEILING_USER_USDX * 10 ** DECIMALS_USDX),
        // for verifying
        this.oracleReporter.wallet.publicKey,
        {
          accounts: {
            authority: userSuper.wallet.publicKey,
            globalState: this.pubKey,
            mintUsdx: this.usdx.pubKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    );

    // send transaction
    const receipt = await handleTxn(
      txn,
      userSuper.provider.connection,
      userSuper.wallet
    );
    return receipt;
  }
}
