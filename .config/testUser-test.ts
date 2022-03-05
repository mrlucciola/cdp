import { Keypair } from "@solana/web3.js";
import testKeyArr from "./testUser-test-keypair.json";
export const secretMnemonic: string =
  "wagon smooth fit gold tumble right combine width width law like glad";
export const publicAddrStr: string =
  "9Ta72gikJtKrpW3Hk1ip78Q7ri3pzALqSKNVsGTdddft";
// no secret key
export const secretKey: string = "";
export const keypairU8: Uint8Array = new Uint8Array(testKeyArr as any[]);
export const userTestKeypair: Keypair = Keypair.fromSecretKey(keypairU8);
