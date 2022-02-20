// libraries
import {
  getProvider,
  IdlAccounts,
  Program,
  Provider,
  web3,
  workspace,
} from "@project-serum/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Token as SplToken,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  AccountInfo,
} from "@solana/spl-token";
import { NodeWallet } from "@project-serum/common";
// local
// import superKeyArr from "../../.config/testUser-super-keypair.json";
import baseKeyArr from "../../.config/testUser-base-keypair.json";
import { StablePool } from "../../target/types/stable_pool";
import * as constants from "../utils/constants";
import {
  airdropSol,
  derivePdaAsync,
  getAcctBalance,
  getAssocTokenAcct,
  getSolBalance,
  handleTxn,
} from "../utils/fxns";
import { Accounts, Vault } from "./accounts";
import { userSuperKeypair } from "../../.config/testUser-super";

const programStablePool = workspace.StablePool as Program<StablePool>;

// will repeat what was done for super, for user
const userBaseKeypair: web3.Keypair = web3.Keypair.fromSecretKey(
  new Uint8Array(baseKeyArr as any[])
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
  wallet: NodeWallet;
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
    wallet: NodeWallet;
  };
}

export const usersObj: Users = {
  base: {
    // @ts-ignore   likely that saber library is interfering with anchor's wallet
    wallet: new NodeWallet(userBaseKeypair),
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
    wallet: new NodeWallet(userSuperKeypair),
  },
};

const testAta = async (user: User, mintToken: SplToken) => {
  const [expectedAtaPubKey, expectedAtaBump] = getAssocTokenAcct(
    user.wallet.publicKey,
    mintToken.publicKey
  );
  
  // const associatedDestinationTokenAddr = await SplToken.getAssociatedTokenAddress(
  //   ASSOCIATED_TOKEN_PROGRAM_ID, // mintToken.associatedProgramId,
  //   TOKEN_PROGRAM_ID, // mintToken.programId,
  //   mintToken.publicKey,
  //   user.wallet.publicKey
  // );
  // console.log({
  //   programStablePool: programStablePool.programId.toString(),
  //   ASSOCIATED_TOKEN_PROGRAM_ID: ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
  //   TOKEN_PROGRAM_ID: TOKEN_PROGRAM_ID.toString(),
  //   mint_associatedProgramId: mintToken.associatedProgramId.toString(),
  //   mint_programId: mintToken.programId.toString(),
  //   mint_publicKey: mintToken.publicKey.toString(),
  //   userPubKey: user.wallet.publicKey.toString()
  // })
  // console.log('exp :', expectedAtaPubKey.toString())
  // console.log('done:', associatedDestinationTokenAddr.toString())
  const txnUserAssoc = new web3.Transaction();
  txnUserAssoc.add(
    SplToken.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID, // associatedProgramId: web3.PublicKey,
      TOKEN_PROGRAM_ID, // programId: web3.PublicKey,
      mintToken.publicKey, // mint: web3.PublicKey,
      expectedAtaPubKey, // associatedAccount: web3.PublicKey,
      user.wallet.publicKey, // owner: web3.PublicKey,
      user.wallet.publicKey // payer: web3.PublicKey
    )
  );
  const confirmationUserAssoc = await handleTxn(
    txnUserAssoc,
    // should we use userProvider?
    getProvider(),
    user.wallet
  );
  console.log('\n\n confirmationUserAssoc', confirmationUserAssoc)
};

/**
 * Create an associated token account (ATA) for a given user-auth account.
 *
 * 1. Derive the ATA.
 * 2. Creates the ATA on chain
 * 3. Mint token to the ATA
 *
 * @param user
 * @param mintSuper - the mint authority's wallet
 * @param mintToken - the
 */
const deriveAndInitAtaUI = async (
  user: User,
  mintSuperWallet: NodeWallet,
  mintToken: SplToken
) => {
  // get token acct for user
  // TODO: DERIVE ATA USING getAssocTokenAcct() - this is a deterministic and preferred way of deriving the pda.
  try {
    await testAta(user, mintToken); // this is not working
    console.log("creating lp saber ata for:", user.wallet.publicKey.toString());
    const expectedAta = getAssocTokenAcct(
      user.wallet.publicKey,
      mintToken.publicKey
    );
    console.log(`expected ata:`, expectedAta[0].toString());
    mintToken.associatedProgramId
    const ataLpSaberInfo: AccountInfo =
      await mintToken.getOrCreateAssociatedAccountInfo(user.wallet.publicKey);
    console.log(`result ata:`, ataLpSaberInfo.address.toString());
    user.ataLpSaber.pubKey = ataLpSaberInfo.address;
  } catch (error) {
    throw new Error(error);
  }
  try {
    console.log("minting saber lp to user ata");
    await mintToken.mintTo(
      user.ataLpSaber.pubKey,
      mintSuperWallet.payer,
      [],
      200_000_000 /* 0.2 LPT */
    );
    console.log(`ata balance: ${(await getAcctBalance(user.ataLpSaber.pubKey)).amount}`);
  } catch (error) {
    throw new Error(error);
  }
};

export const deriveAndInitAtaNew = async (
  provider: Provider,
  userWallet: NodeWallet,
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

  try {
    // getAssocTokenAcct(user.wallet.);
    // user.ataTroveLpSaber.pubKey = ataTroveLpSaberInfo.address;
    const ataTroveLpSaberPubkey = await mintToken.createAssociatedTokenAccount(
      user.troveLpSaber.pubKey
    );
    user.ataTroveLpSaber.pubKey = ataTroveLpSaberPubkey;
  } catch (error) {
    console.log("error here:\n", error);
    throw new Error(error);
  }
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
  await airdropSol(
    provider,
    usersObj.super.wallet.publicKey,
    99999 * LAMPORTS_PER_SOL
  );
  await airdropSol(
    provider,
    usersObj.base.wallet.publicKey,
    99999 * LAMPORTS_PER_SOL
  );
  console.log(
    "airdrop complete\n",
    `base user: ${await getSolBalance(usersObj.base.wallet.publicKey)}\n`,
    `super user: ${await getSolBalance(usersObj.super.wallet.publicKey)}`
  );
  await deriveAndInitAtaUI(
    usersObj.base,
    usersObj.super.wallet,
    accounts.mintLpSaber
  );
  // await deriveTroveAccts(accounts.mintLpSaber, usersObj.base, vault);
  // await deriveUsdAcct(accounts.mintUsd.pubKey, usersObj.base);

  return usersObj;
};
