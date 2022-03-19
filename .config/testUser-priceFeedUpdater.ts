import { Keypair } from "@solana/web3.js";
import testKeyArr from "./testUser-priceFeedUpdater-keypair.json";
export const secretMnemonic: string =
  "sign bacon room symptom regular agree clean fever negative forward wine ball";
export const publicAddrStr: string =
  "EyH4WkXNkyYB1YfAXR7utRpbT6Apr7iMtX4Sxq33Gh9h";
// no secret key
export const secretKey: string = "";
export const keypairU8: Uint8Array = new Uint8Array(testKeyArr as any[]);
export const userPriceFeedUpdaterKeypair: Keypair = Keypair.fromSecretKey(keypairU8);
