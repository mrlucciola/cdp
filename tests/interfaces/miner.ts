// anchor/solana
import { PublicKey } from "@solana/web3.js";
// saber
import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// utils
import { getPda } from "../utils/fxns";
// interfaces
import { ATA } from "./ata";
import { Pool } from "./pool";
import { Vault } from "./vault";
import { TokenReward } from "./TokenReward";
import { TokenCollatUser } from "./TokenCollatUser";

/**
 * owned by a user
 */
export class Miner {
  pubkey: PublicKey;
  bump: number;
  ata: ATA;
  // TODO: combine reward token into one class and input
  tokenReward: TokenReward;
  tokenCollatUser: TokenCollatUser;
  pool: Pool;
  vault: Vault;

  constructor(
    tokenCollatUser: TokenCollatUser,
    tokenReward: TokenReward,
    vault: Vault,
    pool: Pool
  ) {
    this.tokenReward = tokenReward;
    this.vault = vault;
    this.tokenCollatUser = tokenCollatUser;
    this.pool = pool;

    const [pubkey, bump] = getPda(
      [
        Buffer.from("Miner"), // b"Miner".as_ref(),
        this.pool.quarry.pubkey.toBuffer(), // quarry.key().to_bytes().as_ref(),
        this.vault.pubKey.toBuffer(), // authority.key().to_bytes().as_ref()
      ],
      QUARRY_ADDRESSES.Mine
    );
    this.pubkey = pubkey;
    this.bump = bump;

    // alias: miner_vault
    this.ata = new ATA(
      this.pubkey, // authPubKey
      this.tokenCollatUser.tokenCollat.mint, // mintPubKey
      this.tokenCollatUser.tokenCollat.mintAuth, // mintAuth
      this.tokenCollatUser.tokenCollat.decimals, // decimals
      this.tokenCollatUser.tokenCollat.nameToken, // nameToken
      `miner-${this.tokenCollatUser.tokenCollat.nameToken}-${this.tokenReward.nameToken}`, // nameInstance
      null, // mintAuthPubKey
      // this.tokenCollatUser.authority // owner
    );
  }
}
