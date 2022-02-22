// libraries
import {
  IdlAccounts,
  workspace,
  Program,
  Provider,
  Wallet,
  SplToken,
  SplTokenCoder
} from "@project-serum/anchor";
import { PublicKey, Signer } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint } from "@solana/spl-token";
// local
import { StablePool } from "../../target/types/stable_pool";
import * as constants from "../utils/constants";
import { User, Users } from "./users";

const programStablePool = workspace.StablePool as Program<StablePool>;
export interface Vault {
  pubKey: PublicKey;
  bump: number;
  state: any;// IdlAccounts<StablePool>["vault"];
}
export interface Accounts {
  global: {
    pubKey: PublicKey;
    bump: number;
    state: IdlAccounts<StablePool>["globalState"];
  };
  mintUsdx: {
    pubKey: PublicKey;
    bump: number;
  };
  mintLpSaber: PublicKey;
  // collateral vault, with the type of token 'lp' and platform 'saber' and coinpair 'usd-sol'
  vaultLpSaber: Vault;
}

// export const createMintToken2 = async (
//   provider: Provider,
//   mintPubKey: PublicKey,
//   mintAuthWallet: typeof Wallet
// ): Promise<Token> => {
//   const mint = new Token(
//     provider.connection,
//     mintPubKey,
//     TOKEN_PROGRAM_ID,
//     mintAuthWallet.payer
//   );
//   return mint;
// };
export const createMintToken = async (
  provider: Provider,
  // @ts-ignore
  mintAuthWallet: Wallet
): Promise<PublicKey> => {
  const mintTokenPubKey: PublicKey = await createMint(
    provider.connection, // connection — Connection to use
    mintAuthWallet.payer as Signer, // payer — Payer of the transaction and initialization fees
    mintAuthWallet.publicKey, // mintAuthority — Account or multisig that will control minting
    null, // freezeAuthority — Optional account or multisig that can freeze token accounts
    9, // decimals — Location of the decimal place
    // keypair — Optional keypair, defaulting to a new random one
    // confirmOptions — Options for confirming the transaction
    // programId — SPL Token program account
  );
  return mintTokenPubKey;
};

export const configAccountsObj = async (
  provider: Provider,
  users: Users
): Promise<Accounts> => {
  const mintLpSaber: PublicKey = await createMintToken(provider, users.super.wallet);
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
        mintLpSaber.toBuffer(),
      ],
      programStablePool.programId
    ); // prev: [tokenVaultKey, tokenVaultNonce]

  const [mintUsdxPubkey, mintUsdxBump] = await PublicKey.findProgramAddress(
    [Buffer.from(constants.MINT_USDX_SEED)],
    programStablePool.programId
  ); // prev: [mintUsdKey, mintUsdNonce]

  const accounts: Accounts = {
    global: {
      pubKey: globalStatePubkey as PublicKey,
      bump: globalStateBump as number,
      // this is created during the positive test
      state: null as IdlAccounts<StablePool>["globalState"],
    },
    mintUsdx: {
      pubKey: mintUsdxPubkey as PublicKey, // prev: mintUsdKey
      bump: mintUsdxBump as number, // prev: mintUsdNonce
    },
    mintLpSaber,
    vaultLpSaber: {
      // prev: tokenVaultLpSaber
      pubKey: vaultLpSaberPubkey as PublicKey, // prev: tokenVaultKey
      bump: vaultLpSaberBump as number, // prev: tokenVaultNonce
      // this gets created after the PASS test for create-collateral-vault // prev: create-token-vault
      state: null as any // IdlAccounts<StablePool>["vault"], // prev: tokenVault
    },
  };
  return accounts;
};
