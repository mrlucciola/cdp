// anchor/solana
import {
  Provider,
  utils,
  Wallet,
  web3,
  workspace,
  Program,
} from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
// local
import * as constants from "./constants";
import { StablePool } from "../../target/types/stable_pool";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

export class Acct {
  pubKey: PublicKey;
}
export class PDA extends Acct {
  bump: number;
}
export class Trove extends PDA {
  ata: ATA;
}

export interface ITokenAccount {
  mint: PublicKey;
  vault: Vault;
}

export class BaseAcct extends PDA {
  public async getAccount(): Promise<web3.AccountInfo<Buffer>> {
    return await programStablePool.provider.connection.getAccountInfo(
      this.pubKey
    );
  }
  constructor(constant: string, seedsArr: Buffer[]) {
    super();
    
    const [pubkey, bump] = utils.publicKey.findProgramAddressSync(
      [Buffer.from(constant), ...seedsArr],
      programStablePool.programId
    );
    this.pubKey = pubkey;
    this.bump = bump;
  }
}

export class StateAcct extends BaseAcct {
  constructor() {
    super(constants.GLOBAL_STATE_SEED, []);
  }
}
export class MintAcct extends BaseAcct {
  constructor() {
    super(constants.MINT_USDX_SEED, []);
  }
}
export class Vault extends BaseAcct {
  constructor(mintPubKey: PublicKey) {
    super(constants.VAULT_SEED, [mintPubKey.toBuffer()]);
  }
}

/**
 * Associated Token Account
 * @param pubKey - PublicKey: Public Key for ATA
 * @param bump - u8: Bump/nonce
 */
export interface ATA extends Acct {
  bump?: number;
}

export interface UserToken {
  ata: ATA;
  trove: Trove;
}

export interface User {
  wallet: Wallet;
  provider: Provider;
  tokens?: {
    usdx?: UserToken;
    lpSaber?: UserToken; // this doesnt get created until the pass case for trove
  };
}
