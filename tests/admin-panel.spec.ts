import * as anchor from '@project-serum/anchor';
import { StablePool } from '../target/types/stable_pool';
import {
  PublicKey,
  SystemProgram,
  Transaction,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, Token, AccountLayout } from "@solana/spl-token";
import {use as chaiUse, assert, expect} from 'chai'    
import chaiAsPromised from 'chai-as-promised'
chaiUse(chaiAsPromised)

async function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

describe('admin-panel', function() {
  // Constants
  const GLOBAL_STATE_TAG = "global-state-seed";
  const TOKEN_VAULT_TAG = "token-vault-seed";
  const USER_TROVE_TAG = "user-trove-seed";
  const USD_MINT_TAG = "usd-mint";
  const USD_TOKEN_TAG = "usd-token";
  const USER_TROVE_POOL_TAG = "user-trove-pool";

  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const stablePoolProgram = anchor.workspace.StablePool as anchor.Program<StablePool>;
  //const superOwner = anchor.web3.Keypair.generate();
  //const user = anchor.web3.Keypair.generate();

  const user = anchor.web3.Keypair.fromSecretKey(new Uint8Array([104,155,54,210,140,177,188,104,40,172,169,66,101,176,231,31,72,200,64,131,208,190,48,19,88,24,120,175,211,244,81,16,29,181,197,142,71,127,186,94,168,207,50,86,7,47,213,125,181,235,122,80,133,42,230,222,120,75,5,233,201,228,120,75]));
  const superOwner = anchor.web3.Keypair.fromSecretKey(new Uint8Array([248,117,94,64,137,224,108,14,118,36,69,1,239,191,223,71,124,68,42,6,102,244,247,159,98,192,68,119,156,255,97,223,38,117,172,163,116,6,151,12,215,178,92,106,178,185,76,227,114,36,45,2,32,234,125,2,122,23,171,243,189,169,252,174]));

  let userCollKey = null;
  let userUsdxTokenAccount = null;

  let lpMint = null;
  const depositAmount = 100_000_000; // 0.1 LPT
  const tvlLimit = 1_000_000_000;
  const USD_DECIMAL = 6;
  const globalDebtCeiling = 15_000_000;
  const vaultDebtCeiling = 10_000_000;

  console.log("superOwner =", superOwner.publicKey.toBase58());
  console.log("user =", user.publicKey.toBase58());

  let tokenVaultKey, tokenVaultNonce;
  let userTroveKey, userTroveNonce;
  let tokenCollKey, tokenCollNonce;
  let globalStateKey, globalStateNonce;
  let mintUsdKey, mintUsdNonce;
  let userUsdKey, userUsdNonce;

  this.beforeAll(async function() {
    while (await provider.connection.getBalance(superOwner.publicKey) == 0){
      try{
        // Request Airdrop for user
        await provider.connection.confirmTransaction(
          await provider.connection.requestAirdrop(superOwner.publicKey, 100000000),
          "confirmed"
        );
      }catch{}
      
    };
    while (await provider.connection.getBalance(user.publicKey) == 0){
      try{
        // Request Airdrop for user
        await provider.connection.confirmTransaction(
          await provider.connection.requestAirdrop(user.publicKey, 100000000),
          "confirmed"
        );
      }catch{}
    };
    lpMint = await Token.createMint(
      provider.connection,
      superOwner,
      superOwner.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );
    userCollKey = await lpMint.createAccount(user.publicKey);
    console.log("lpMint =", lpMint.publicKey.toBase58());
    console.log("userCollKey =", userCollKey.toBase58());
    await lpMint.mintTo(
      userCollKey,
      superOwner,
      [],
      200_000_000 /* 0.2 LPT */
    );

    [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );
    [userTroveKey, userTroveNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );
    [tokenCollKey, tokenCollNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_POOL_TAG), userTroveKey.toBuffer()],
        stablePoolProgram.programId,
      );
    [globalStateKey, globalStateNonce] = 
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );
    [mintUsdKey, mintUsdNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USD_MINT_TAG)],
        stablePoolProgram.programId,
      );
    [userUsdKey, userUsdNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USD_TOKEN_TAG), user.publicKey.toBuffer(), mintUsdKey.toBuffer()],
        stablePoolProgram.programId,
      );
  })
  
  it('Create Global State', async () => {
    let txHash = await stablePoolProgram.rpc.createGlobalState(
      globalStateNonce, 
      mintUsdNonce,
      new anchor.BN(tvlLimit),
      new anchor.BN(globalDebtCeiling),
      {
        accounts: {
          superOwner: superOwner.publicKey,
          globalState: globalStateKey,
          mintUsd: mintUsdKey, 
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [superOwner]
      }
    );
    const globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
    assert(globalState.superOwner.toBase58() == superOwner.publicKey.toBase58());
    assert(globalState.mintUsd.toBase58() == mintUsdKey.toBase58());
    assert(globalState.tvlLimit.toNumber() == tvlLimit, "GlobalState TVL Limit: " + globalState.tvlLimit + " TVL Limit: " + tvlLimit);
    assert(globalState.tvl.toNumber() == 0);
  });

  it('Pause CDP in Emergency state', async () => {
    let tx = await stablePoolProgram.rpc.toggleEmerState(
      1, // paused
      {
        accounts: {
          payer: superOwner.publicKey,
          globalState: globalStateKey,
        },
        signers: [superOwner]
      }
    );
    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
    assert(globalState.paused == 1, "CDP Not Paused");
  });
  
  it('Reinitialize', async () => {
    lpMint = await Token.createMint(
      provider.connection,
      superOwner,
      superOwner.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );
    userCollKey = await lpMint.createAccount(user.publicKey);
    await lpMint.mintTo(
      userCollKey,
      superOwner,
      [],
      200_000_000 /* 0.2 LPT */
    );

    [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );
    [userTroveKey, userTroveNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );
    [tokenCollKey, tokenCollNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_POOL_TAG), userTroveKey.toBuffer()],
        stablePoolProgram.programId,
      );
  });
  
  it('Resume CDP in Emergency state', async () => {
    let tx = await stablePoolProgram.rpc.toggleEmerState(
      0, // paused
      {
        accounts: {
          payer: superOwner.publicKey,
          globalState: globalStateKey,
        },
        signers: [superOwner]
      }
    );
    console.log("tx =", tx);
    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
    assert(globalState.paused == 0, "CDP Not Resumed");
  });

  it('Pause CDP in Emergency state with other user', async () => {
    let tx = await stablePoolProgram.rpc.toggleEmerState(
      1, // paused
      {
        accounts: {
          payer: user.publicKey,
          globalState: globalStateKey,
        },
        signers: [user]
      }
    );
    console.log("tx =", tx);
    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
    assert(globalState.paused == 1, "CDP Not Paused");
  });
});
