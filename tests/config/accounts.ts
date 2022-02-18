// libraries
import {
  IdlAccounts,
  workspace,
  Program,
  Provider,
  Wallet,
} from "@project-serum/anchor";
import { PublicKey, Signer } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
// local
import { StablePool } from "../../target/types/stable_pool";
import * as constants from "../utils/constants";
import { User, Users } from "./users";

const programStablePool = workspace.StablePool as Program<StablePool>;
export interface Vault {
  pubKey: PublicKey;
  bump: number;
  state: IdlAccounts<StablePool>["vault"];
}
export interface Accounts {
  global: {
    pubKey: PublicKey;
    bump: number;
    state: IdlAccounts<StablePool>["globalState"];
  };
  mintUsd: {
    pubKey: PublicKey;
    bump: number;
  };
  mintLpSaber: Token;
  // collateral vault, with the type of token 'lp' and platform 'saber' and coinpair 'usd-sol'
  vaultLpSaber: Vault;
}

export const createMintToken2 = async (
  provider: Provider,
  mintPubKey: PublicKey,
  mintAuthWallet: typeof Wallet
): Promise<Token> => {
  const mint = new Token(
    provider.connection,
    mintPubKey,
    TOKEN_PROGRAM_ID,
    mintAuthWallet.payer
  );
  return mint;
};
export const createMintToken = async (
  provider: Provider,
  // @ts-ignore
  mintAuthWallet: Wallet
): Promise<Token> => {
  const mintToken = await Token.createMint(
    provider.connection,
    mintAuthWallet.payer as Signer,
    mintAuthWallet.publicKey,
    null,
    9,
    TOKEN_PROGRAM_ID
  );
  return mintToken;
};

export const configAccountsObj = async (
  provider: Provider,
  users: Users
): Promise<Accounts> => {
  const mintLpSaber: Token = await createMintToken(provider, users.super.wallet);
  const [globalStatePubkey, globalStateBump] =
    await PublicKey.findProgramAddress(
      [Buffer.from(constants.GLOBAL_STATE_SEED)],
      programStablePool.programId
    ); // prev: [globalStateKey, globalStateNonce]

  // token vault is derived from the LP mint account - this also exists in 'pdas'
  const [vaultLpSaberPubkey, vaultLpSaberBump] =
    await PublicKey.findProgramAddress(
      [
        Buffer.from(constants.VAULT_SEED),
        mintLpSaber.publicKey.toBuffer(),
      ],
      programStablePool.programId
    ); // prev: [tokenVaultKey, tokenVaultNonce]

  const [mintUsdPubkey, mintUsdBump] = await PublicKey.findProgramAddress(
    [Buffer.from(constants.MINT_USD_SEED)],
    programStablePool.programId
  ); // prev: [mintUsdKey, mintUsdNonce]

  const accounts: Accounts = {
    global: {
      pubKey: globalStatePubkey as PublicKey,
      bump: globalStateBump as number,
      // this is created during the positive test
      state: null as IdlAccounts<StablePool>["globalState"],
    },
    mintUsd: {
      pubKey: mintUsdPubkey as PublicKey, // prev: mintUsdKey
      bump: mintUsdBump as number, // prev: mintUsdNonce
    },
    // im not sure why we do it this way rather than how we do mint usd
    mintLpSaber,
    vaultLpSaber: {
      // prev: tokenVaultLpSaber
      pubKey: vaultLpSaberPubkey as PublicKey, // prev: tokenVaultKey
      bump: vaultLpSaberBump as number, // prev: tokenVaultNonce
      // this gets created after the PASS test for create-collateral-vault // prev: create-token-vault
      state: null as IdlAccounts<StablePool>["vault"], // prev: tokenVault
    },
  };
  return accounts;
};
