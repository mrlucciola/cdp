// anchor/solana
import {
  web3,
  Provider,
  Wallet,
  utils,
  workspace,
  Program,
  getProvider,
} from "@project-serum/anchor";
import { PublicKey, TokenAmount, Transaction } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { sha256 } from "js-sha256";
// local
import { Accounts, Vault } from "../config/accounts";
import { User } from "../config/users";
import { StablePool } from "../../target/types/stable_pool";

const programStablePool = workspace.StablePool as Program<StablePool>;

export const handleTxn = async (
  txn: web3.Transaction,
  user: User,
) => {

  // prep txn
  txn.feePayer = user.wallet.publicKey;
  try {
    txn.recentBlockhash = (
      await user.provider.connection.getLatestBlockhash()
    ).blockhash;
  } catch (error) {
    throw new Error(error);
  }

  // send txn
  try {
    const signedTxn: Transaction = await user.wallet.signTransaction(txn);
    const receipt: string = await user.provider.send(signedTxn);
    const confirmation: web3.RpcResponseAndContext<web3.SignatureResult> =
      await user.provider.connection.confirmTransaction(receipt);

    console.log("txn receipt", receipt);
    console.log("txn confirmation", confirmation);
    return receipt;
  } catch (error) {
    console.log("\nsending txn err: ", error, '\n');
    throw Error(error);
  }







  // txn_.feePayer = txnWallet.publicKey;
  // txn_.recentBlockhash = (
  //   await txnProvider.connection.getLatestBlockhash()
  // ).blockhash;
  // const signedTxn: web3.Transaction = await txnWallet.signTransaction(txn_);
  // try {
  //   const resMain: string = await txnProvider.send(signedTxn);
  //   const conf: web3.RpcResponseAndContext<web3.SignatureResult> =
  //     await txnProvider.connection.confirmTransaction(resMain);

  //   return resMain;
  // } catch (error) {
  //   console.log("err: ", error);
  //   throw Error(error);
  // }
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

export const getSolBalance = async (pubKey: PublicKey, provider: Provider = getProvider()) => {
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
