// anchor/solana
import {
  web3,
  Provider,
  utils,
  getProvider,
  Wallet,
} from "@project-serum/anchor";
import {
  Connection,
  PublicKey,
  TokenAmount,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
// local
import { translateError } from "./errors";
import { TestTokens } from "./types";
import { User } from "../interfaces/user";
import { ATA, GeneralToken, MintPubKey, UserToken } from "./interfaces";
import {
  // @ts-ignore
  mintTo,
  // @ts-ignore
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

/**
 * We use user provider and user wallet because
 * @param txn
 * @param userProvider
 * @param userWallet
 * @returns receipt - string
 */
export const handleTxn = async (
  txn: web3.Transaction,
  userConnection: Connection,
  userWallet: Wallet
) => {
  // prep txn
  txn.feePayer = userWallet.publicKey;
  try {
    txn.recentBlockhash = (await userConnection.getLatestBlockhash()).blockhash;
  } catch (error) {
    throw error;
  }

  // send txn
  try {
    const signedTxn: Transaction = await userWallet.signTransaction(txn);
    const rawTxn: Buffer = signedTxn.serialize();
    const options = {
      skipPreflight: true,
      commitment: "singleGossip",
    };

    const receipt: string = await userConnection.sendRawTransaction(
      rawTxn,
      options
    );
    const confirmation: web3.RpcResponseAndContext<web3.SignatureResult> =
      await userConnection.confirmTransaction(receipt);
    if (confirmation.value.err)
      throw new Error(JSON.stringify(confirmation.value.err));
    else return receipt;
  } catch (error) {
    translateError(error);
  }
};

export const airdropSol = async (
  provider: Provider,
  target: web3.PublicKey,
  lamps: number
): Promise<string> => {
  const sig: string = await provider.connection.requestAirdrop(target, lamps);
  await provider.connection.confirmTransaction(sig);
  return sig;
};

export const safeAirdropSol = async (
  provider: Provider,
  target: web3.PublicKey,
  lamps: number
): Promise<void> => {
  while ((await getSolBalance(target, provider)) < lamps) {
    try {
      // Request Airdrop for user
      await airdropSol(provider, target, lamps);
    } catch (e) {
      console.log(e);
    }
  }
};

export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Returns the same value as Token.getAssociatedTokenAddress()
 * but this function does this synchronously
 * and also returns a bump if needed
 *
 * @param ownerPubKey PublicKey
 * @param mintPubKey PublicKey
 * @returns [PublicKey, number]
 */
export const getAssocTokenAcct = (
  ownerPubKey: PublicKey,
  mintPubKey: PublicKey
): [PublicKey, number] => {
  const seeds: Buffer[] = [
    ownerPubKey.toBuffer(),
    TOKEN_PROGRAM_ID.toBuffer(),
    mintPubKey.toBuffer(),
  ];
  const programId: PublicKey = ASSOCIATED_TOKEN_PROGRAM_ID;
  return utils.publicKey.findProgramAddressSync(seeds, programId);
};

export const getAcctInfo = async (
  provider: Provider,
  acctPubKey: PublicKey
): Promise<web3.AccountInfo<Buffer>> => {
  const accountInfo: web3.AccountInfo<Buffer> =
    await provider.connection.getAccountInfo(acctPubKey);
  return accountInfo;
};

export const getAcctBalance = async (
  acctPubKey: PublicKey,
  provider: Provider = getProvider()
): Promise<TokenAmount> => {
  return (await provider.connection.getTokenAccountBalance(acctPubKey)).value;
};

export const getPda = (seeds: Buffer[], programId: PublicKey) => {
  return utils.publicKey.findProgramAddressSync(seeds, programId);
};

export const derivePdaAsync = async (
  seeds: Buffer[],
  programId: PublicKey
): Promise<[PublicKey, number]> => {
  const [pubKey, bump] = await PublicKey.findProgramAddress(seeds, programId);
  return [pubKey, bump];
};

export const getSolBalance = async (
  pubKey: PublicKey,
  provider: Provider = getProvider()
) => {
  return await provider.connection.getBalance(pubKey);
};

export const mintToAta = async (
  mintTokenStr: TestTokens,
  mintPubKey: PublicKey,
  mintAuth: User,
  dest: UserToken | GeneralToken,
  amount: number = 200_000_000 // 0.2 units of token
) => {
  // mint to newly created ata
  const ataBalanceOrig = Number((await getAcctBalance(dest.ata.pubKey)).amount);
  console.log(`minting ${mintTokenStr} to ata, balance: ${ataBalanceOrig}`);
  try {
    await mintTo(
      mintAuth.provider.connection, // connection — Connection to use
      mintAuth.wallet.payer, // payer — Payer of the transaction fees
      mintPubKey, // mint — Mint for the account
      dest.ata.pubKey, // destination — Address of the account to mint to
      mintAuth.wallet.publicKey, // authority — Minting authority
      amount // amount — Amount to mint
    );
  } catch (error) {
    throw error;
  }
  const ataBalanceNew = Number((await getAcctBalance(dest.ata.pubKey)).amount);
  const diff = ataBalanceNew - ataBalanceOrig;
  console.log(`ata balance: ${ataBalanceOrig} -> ${ataBalanceNew}  ∆=${diff}`);
};

/**
 * Create an associated token account (ATA) for a given user-auth account.
 *
 * 1. Derive the ATA.
 * 2. Create the ATA on chain
 * 3. Mint token to the ATA
 *
 * @param userWallet
 * @param userConnection
 * @param mintPubKey - the mint pub key
 * @param authorityPubKey - the authority
 */
export const deriveAndInitAta = async (
  userWallet: Wallet,
  userConnection: Connection,
  mintPubKey: PublicKey,
  authorityPubKey?: PublicKey
): Promise<[PublicKey, number]> => {
  const auth = authorityPubKey || userWallet.publicKey;
  // 1) get token acct for user
  const [ataPubKey, bump] = getAssocTokenAcct(auth, mintPubKey);

  // create instruction & add to transaction
  const txn = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      userWallet.publicKey, // payer: web3.PublicKey,
      ataPubKey, // associatedToken: web3.PublicKey,
      auth, // owner: web3.PublicKey,
      mintPubKey // mint: web3.PublicKey,
    )
  );

  // sign and send
  await handleTxn(txn, userConnection, userWallet);
  return [ataPubKey, bump];
};

export const createAtaOnChain = async (
  userWallet: Wallet,
  ata: ATA,
  mintPubKey: MintPubKey,
  auth?: PublicKey,
  userConnection: Connection = null
) => {
  const txn = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      userWallet.publicKey, // payer: web3.PublicKey,
      ata.pubKey, // associatedToken: web3.PublicKey,
      auth || userWallet.publicKey, // owner: web3.PublicKey,
      mintPubKey // mint: web3.PublicKey,
    )
  );
  userConnection && (await handleTxn(txn, userConnection, userWallet));
};
