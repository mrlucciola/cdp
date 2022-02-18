// libraries
import {
  IdlAccounts,
  Program,
  Provider,
  Wallet,
  web3,
  workspace,
} from "@project-serum/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Token as SplToken,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
// local
import superKeyArr from "../../.config/testUser-super-keypair.json";
import baseKeyArr from "../../.config/testUser-base-keypair.json";
import { StablePool } from "../../target/types/stable_pool";
import * as constants from "../utils/constants";
import {
  airdrop,
  derivePdaAsync,
  getAssocTokenAcct,
  handleTxn,
} from "../utils/fxns";
import { Accounts, Vault } from "./accounts";

const programStablePool = workspace.StablePool as Program<StablePool>;

const userBaseKeypair: web3.Keypair = web3.Keypair.fromSecretKey(
  new Uint8Array(baseKeyArr as any[])
);

const userSuperKeypair: web3.Keypair = web3.Keypair.fromSecretKey(
  new Uint8Array(superKeyArr as any[])
);

export interface PDA {
  pubKey: PublicKey;
  bump: number;
}
const emptyPda = {
  pubKey: null as PublicKey,
  bump: null as number,
};
export interface User {
  // @ts-ignore   likely that saber library is interfering with anchor's wallet
  wallet: Wallet;
  // prev: userCollKey
  ataLpSaber: PDA;
  troveLpSaber: {
    pubKey: PublicKey; // prev: userTroveKey -> trovePubKey
    bump: number; // prev: userTroveNonce
    // this doesnt get created until the pass case for trove
    state: IdlAccounts<StablePool>["trove"];
  };
  ataTroveLpSaber: PDA;
  usd: PDA;
}
export interface Users {
  base: User;
  super: {
    // @ts-ignore   likely that saber library is interfering with anchor's wallet
    wallet: Wallet;
  };
}

export const usersObj: Users = {
  base: {
    // @ts-ignore   likely that saber library is interfering with anchor's wallet
    wallet: new Wallet(userBaseKeypair),
    // prev: userCollKey
    ataLpSaber: emptyPda,
    troveLpSaber: {
      ...emptyPda,
      state: null as IdlAccounts<StablePool>["trove"],
    },
    ataTroveLpSaber: emptyPda,
    usd: emptyPda,
  },
  super: {
    // @ts-ignore   likely that saber library is interfering with anchor's wallet
    wallet: new Wallet(userSuperKeypair),
  },
};

export const deriveAndInitAta = async (
  provider: Provider,
  // @ts-ignore    see note about saber messing with Wallet
  userWallet: Wallet,
  mintPubKey: PublicKey
) => {
  // we dont need bump but its here just in case
  const [ataLpSaberPubkey, ataLpSaberBump] = getAssocTokenAcct(
    userWallet.publicKey,
    mintPubKey
  );

  const txnUserAssoc = new web3.Transaction();
  txnUserAssoc.add(
    SplToken.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID, // associatedProgramId: web3.PublicKey,
      TOKEN_PROGRAM_ID, // programId: web3.PublicKey,
      mintPubKey, // mint: web3.PublicKey,
      ataLpSaberPubkey, // associatedAccount: web3.PublicKey,
      userWallet.publicKey, // owner: web3.PublicKey,
      userWallet.publicKey // payer: web3.PublicKey
    )
  );
  try {
    const confirmationUserAssoc = await handleTxn(
      txnUserAssoc,
      // should we use userProvider?
      provider,
      userWallet
    );
    console.log("success");
    return confirmationUserAssoc;
  } catch (error) {
    console.log("\n\nerror with derive-and-init-ata");
    console.log(error);
    // jkap: i know its redundant
    throw new Error(error);
  }
};

export const deriveTroveAccts = async (
  mintToken: SplToken,
  user: User,
  vault: Vault // prev: tokenVault -> vaultColl
) => {
  // troves are derived from a vault
  const seeds = [
    Buffer.from(constants.TROVE_SEED),
    vault.pubKey.toBuffer(),
    user.wallet.publicKey.toBuffer(),
  ];
  // prev: [userTroveKey, userTroveNonce]

  // can we use the sync version of this fxn?
  const [trovePubKey, troveBump] = await derivePdaAsync(
    seeds,
    programStablePool.programId
  );
  // assign to global test state
  user.troveLpSaber.pubKey = trovePubKey;
  user.troveLpSaber.bump = troveBump;

  // get token acct for trove
  // TODO: DERIVE ATA USING getAssocTokenAcct() - this is a deterministic and preferred way of deriving the pda.
  const ataTroveLpSaberPubkey = await mintToken.createAssociatedTokenAccount(
    user.troveLpSaber.pubKey
  );
  user.ataTroveLpSaber.pubKey = ataTroveLpSaberPubkey;
  const ataLpSaberPubkey = await mintToken.createAssociatedTokenAccount(
    user.wallet.publicKey
  );
  user.ataLpSaber.pubKey = ataLpSaberPubkey;
};
export const deriveUsdAcct = async (mintPubKey: PublicKey, user: User) => {
  // create usd and assign to state var
  const seeds = [
    Buffer.from(constants.USD_TOKEN_SEED),
    user.wallet.publicKey.toBuffer(),
    mintPubKey.toBuffer(),
  ];
  // can we use the sync version?
  const [userUsdKey, userUsdBump] = await derivePdaAsync(
    seeds,
    programStablePool.programId
  );

  user.usd.pubKey = userUsdKey;
  user.usd.bump = userUsdBump;
};

export const initUsersObj = async (
  provider: Provider,
  accounts: Accounts,
  usersObj: Users,
  vault: Vault
) => {
  await deriveTroveAccts(accounts.mintLpSaber, usersObj.base, vault);
  await deriveUsdAcct(accounts.mintUsd.pubKey, usersObj.base);
  await airdrop(
    provider,
    usersObj.super.wallet.publicKey,
    99999 * LAMPORTS_PER_SOL
  );
  await airdrop(
    provider,
    usersObj.base.wallet.publicKey,
    99999 * LAMPORTS_PER_SOL
  );

  return usersObj;
};
