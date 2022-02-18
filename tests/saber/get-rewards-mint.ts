/// <reference types="mocha" />

// anchor/solana
import * as anchor from "@project-serum/anchor";
import type { PublicKey } from "@solana/web3.js";
import { u64 } from "@saberhq/token-utils";
// saber
// why are we using these outdated libraries
import { Saber } from "@saberhq/saber-periphery";
import { makeSaberProvider } from "@saberhq/anchor-contrib";

let rewardsMint: PublicKey | null = null;

export const getRewardsMint = (): PublicKey => {
  return rewardsMint!;
};

export const DEFAULT_DECIMALS = 6;
export const DEFAULT_HARD_CAP = new u64("10000000000000000"); // 10 billion
export const LOCAL_CHAIN_ID = 100;

export const makeSDK = (): Saber => {
  const ANCHOR_PROVIDER_URL = process.env.ANCHOR_PROVIDER_URL;
  if (!ANCHOR_PROVIDER_URL) {
    throw new Error("no anchor provider URL");
  }
  const anchorProvider = anchor.getProvider();
  // if the program isn't loaded, load the default
  const provider = makeSaberProvider(anchorProvider);
  return Saber.load({ provider });
};
