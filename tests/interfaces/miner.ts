// anchor/solana
import { PublicKey } from "@solana/web3.js";
// saber
import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// local
import { getPda } from "../utils/fxns";
import { MintPubKey, QuarryClass, Vault } from "../utils/interfaces";
import { ATA } from "./ata";
export class Miner {
  pubkey: PublicKey;
  bump: number;
  ata: ATA;

  constructor(vault: Vault, quarry: QuarryClass, mintPubKey: MintPubKey) {
    const [pubkey, bump] = getPda(
      [
        Buffer.from("Miner"), // b"Miner".as_ref(),
        quarry.pubkey.toBuffer(), // quarry.key().to_bytes().as_ref(),
        vault.pubKey.toBuffer(), // authority.key().to_bytes().as_ref()
      ],
      QUARRY_ADDRESSES.Mine
    );
    this.pubkey = pubkey;
    this.bump = bump;
    // [this.pubkey, this.bump] = findProgramAddressSync(
    //   [
    //     Buffer.from(utils.bytes.utf8.encode("Miner")),
    //     quarry.toBytes(),
    //     vault.pubKey.toBytes(),
    //   ],
    //   QUARRY_ADDRESSES.Mine
    // );
    this.ata = new ATA(this.pubkey, mintPubKey);
  }
}
