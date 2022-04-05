import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
import { PublicKey } from "@solana/web3.js";
import { getPda } from "../utils/fxns";
import { ATA, MintPubKey, QuarryClass, Vault } from "../utils/interfaces";

export class Miner {
  pubkey: PublicKey;
  bump: number;
  ata: ATA;
  constructor(vault: Vault, quarry: QuarryClass, mintPubKey: MintPubKey) {
    // b"Miner".as_ref(),
    // quarry.key().to_bytes().as_ref(),
    // authority.key().to_bytes().as_ref()
    const [pubkey, bump] = getPda(
      [
        Buffer.from("Miner"),
        // Buffer.from(utils.bytes.utf8.encode("Miner")),
        quarry.pubkey.toBuffer(), // quarryKey.toBuffer(),
        vault.pubKey.toBuffer(),
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
