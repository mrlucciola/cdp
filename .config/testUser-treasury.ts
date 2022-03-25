import { Keypair } from "@solana/web3.js";
import testKeyArr from "./testUser-test-keypair.json";
export const secretMnemonic: string =
  "trust gallery giggle resemble sure neglect road obscure convince gorilla slush mention";
export const publicAddrStr: string =
  "GPsU1gh4DhRHJtkcrhpxCGaBz88TZzBXBHvnf63WyC6p";
// no secret key
export const secretKey: string = "";
export const keypairU8: Uint8Array = new Uint8Array(testKeyArr as any[]);
export const userTestKeypair: Keypair = Keypair.fromSecretKey(keypairU8);
