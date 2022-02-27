// anchor/solana
import {
  web3,
  Provider,
  utils,
  workspace,
  Program,
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
import { StablePool } from "../../target/types/stable_pool";
import { User } from "./interfaces";
import { translateError } from "./errors";

const programStablePool = workspace.StablePool as Program<StablePool>;

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
    if (confirmation.value.err) throw new Error(JSON.stringify(confirmation.value.err));
    else return receipt;
  } catch (error) {
    translateError(error)
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

// this is a one-off since we repeat this code like 50 times in the repo
// export const getGlobalStateVaultAndTrove = async (
//   accounts: Accounts,
//   user: User,
//   vaultAcct: Vault
// ) => {
//   const vault = await programStablePool.account.vault.fetch(vaultAcct.pubKey);
//   const trove = await programStablePool.account.trove.fetch(
//     user.troveLpSaber.pubKey
//   );
//   const globalState = await programStablePool.account.globalState.fetch(
//     accounts.global.pubKey
//   );
//   return { vault, trove, globalState };
// };
