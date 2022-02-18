import { Keypair } from "@solana/web3.js";
import superKeyArr from "./testUser-super-keypair.json";
export const secretMnemonic: string =
  "arrow pulp weasel silent tenant utility possible rose hard problem toast wife retreat away torch cargo game slogan expect often world wait monitor boy";
export const publicAddrStr: string =
  "7Lw3e19CJUvR5qWRj8J6NKrV2tywiJqS9oDu1m8v4rsi";
export const secretKey: string =
  "4gsjHRSaAbxxKW5jvSFeg692Lxfdu7x2vLUBFYWjMWmvV9dvD1BdKHB8d3PtSsyF8VGbrVDKNUYkMeN5f4hpb1M2";
export const keypairU8: Uint8Array = new Uint8Array(superKeyArr as any[]);
export const userSuperKeypair: Keypair = Keypair.fromSecretKey(keypairU8);
