/// <reference types="mocha" />

import { expectTX } from "@saberhq/chai-solana";
import { PendingTransaction } from "@saberhq/solana-contrib";
import { createMint, u64, } from "@saberhq/token-utils";
import type { PublicKey } from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Saber } from "@saberhq/saber-periphery";
import { makeSaberProvider } from "@saberhq/anchor-contrib";
import * as anchor from "@project-serum/anchor";

// import invariant from "tiny-invariant";

// import { DEFAULT_DECIMALS, DEFAULT_HARD_CAP, makeSDK } from "../util/saber-periphery-workspace";

let rewardsMint: PublicKey | null = null;

export const getRewardsMint = (): PublicKey => {
  // invariant(rewardsMint, "not initialized");
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

// if (!rewardsMint) {
//   before("Initialize mint", async () => {
//     const saber = makeSDK();
//     const { provider, mintProxy } = saber;

//     // await new PendingTransaction(
//     //   provider.connection,
//     await provider.connection.requestAirdrop(
//       provider.wallet.publicKey,
//       LAMPORTS_PER_SOL * 10
//     )
//     // ).wait();

//     rewardsMint = await createMint(
//       provider,
//       provider.wallet.publicKey,
//       DEFAULT_DECIMALS
//     );
//     console.log("rewardsMint:", rewardsMint.toString());
//     console.log("provider:", provider.wallet.publicKey.toString());

//     const { tx } = await mintProxy.new({
//       hardcap: DEFAULT_HARD_CAP,
//       mintAuthority: provider.wallet.publicKey,
//       tokenMint: rewardsMint,
//     });

//     // await expectTX(tx, "Initialize MintProxy").to.be.fulfilled;
//     await tx.confirm();
//   });
// }
