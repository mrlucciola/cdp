import { Keypair } from "@solana/web3.js";
import baseKeyArr from "./testUser-base-keypair.json";
export const secretMnemonic: string = "";
export const publicAddrStr: string = "";
// no secret key
export const secretKey: string = "";
export const keypairU8: Uint8Array = new Uint8Array(baseKeyArr as any[]);
export const userBaseKeypair: Keypair = Keypair.fromSecretKey(keypairU8);
