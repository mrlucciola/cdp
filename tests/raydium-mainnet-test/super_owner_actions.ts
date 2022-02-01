// raydium integration unit tests on mainnet
import * as anchor from '@project-serum/anchor';
import { StablePool } from '../../target/types/stable_pool';
import {
  PublicKey,
  Account,
  SystemProgram,
  Transaction,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, Token, AccountLayout } from "@solana/spl-token";
import {use as chaiUse, assert, expect} from 'chai'    
import chaiAsPromised from 'chai-as-promised'
chaiUse(chaiAsPromised)

import SUPER_OWNER_WALLET from './super_owner.json'
import USER1_WALLET from './user1.json'


describe('super_owner_actions', () => {
    // Constants
    const GLOBAL_STATE_TAG = "global-state-seed";
    const TOKEN_VAULT_TAG = "token-vault-seed";
    const USER_TROVE_TAG = "user-trove";
    const USD_MINT_TAG = "usd-mint";
    const USD_TOKEN_TAG = "usd-token";
    const USER_TROVE_POOL_TAG = "user-trove-pool";

    // Configure the client to use the local cluster.
    const superOwner = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
    const user1 = anchor.web3.Keypair.fromSecretKey(Buffer.from(USER1_WALLET))

    const provider = anchor.Provider.env();
    const superOwnerProvider = new anchor.Provider(provider.connection, new anchor.Wallet(superOwner), {});
    const user1Provider = new anchor.Provider(provider.connection, new anchor.Wallet(user1), {});

    anchor.setProvider(superOwnerProvider);
    let stablePoolProgram = anchor.workspace.StablePool as anchor.Program<StablePool>;

    // SAMO-RAY FARM test info
    const SAMO_RAY_LP_MINT = new anchor.web3.PublicKey("HwzkXyX8B45LsaHXwY8su92NoRBS5GQC32HzjQRDqPnr");
    const USER1_SAMO_RAY_LP_ATA = new anchor.web3.PublicKey("BSzheTQWMD843BC3BPV3qF39XzsDqeh9Gm4HaXN3ZT2v");

    // MEAN-RAY FARM test info (Dual Farm)

    const tvlLimit = 1_000_000_000;

    it('Is initialized!', async () => {
      const superOwnerBalance = await provider.connection.getBalance(superOwner.publicKey)
      const user1Balance = await provider.connection.getBalance(superOwner.publicKey)
      console.log("superOwner =", superOwnerProvider.wallet.publicKey.toBase58(), "balance = ", superOwnerBalance);
      console.log("user1 =", user1Provider.wallet.publicKey.toBase58(), "user1 = ", user1Balance);
      
    });
    
    it('Create Global State', async () => {
      

      console.log("stablePoolProgram.programId =", stablePoolProgram.programId.toBase58());
      console.log("payer =", stablePoolProgram.provider.wallet.publicKey.toBase58());
      
      const [globalStateKey, globalStateNonce] = 
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(GLOBAL_STATE_TAG)],
          stablePoolProgram.programId,
        );
  
      console.log("globalStateKey =", globalStateKey.toBase58());
  
      const [mintUsdKey, mintUsdNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(USD_MINT_TAG)],
          stablePoolProgram.programId,
        );
  
      console.log("mintUsdKey =", mintUsdKey.toBase58());
  
      let txHash = await stablePoolProgram.rpc.createGlobalState(
        globalStateNonce, 
        mintUsdNonce,
        new anchor.BN(tvlLimit),
        {
          accounts: {
            superOwner: superOwner.publicKey,
            globalState: globalStateKey,
            mintUsd: mintUsdKey, 
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      ).catch(e => {
        console.log("e =", e);
      });
      console.log("txHash =", txHash);
  
      const globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
  
      assert(globalState.superOwner.toBase58() == superOwner.publicKey.toBase58());
      assert(globalState.mintUsd.toBase58() == mintUsdKey.toBase58());
      assert(globalState.tvlLimit.toNumber() == tvlLimit, "GlobalState TVL Limit: " + globalState.tvlLimit + " TVL Limit: " + tvlLimit);
      assert(globalState.tvl.toNumber() == 0);
    });
    it('Create Token Vault', async () => {

      const [globalStateKey, globalStateNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(GLOBAL_STATE_TAG)],
          stablePoolProgram.programId,
        );
      console.log("GlobalStateKey", globalStateKey.toBase58());
  
      //const globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
      //console.log("fetched globalState", globalState);
  
      const [tokenVaultKey, tokenVaultNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(TOKEN_VAULT_TAG), SAMO_RAY_LP_MINT.toBuffer()],
          stablePoolProgram.programId,
        );
      console.log("tokenVaultKey",tokenVaultKey.toBase58());
  
      const riskLevel = 0;
      const isDual = 0;
      let txHash = await stablePoolProgram.rpc.createTokenVault(
          tokenVaultNonce, 
          riskLevel,
          isDual,
          {
            accounts: {
              payer: superOwner.publicKey,
              tokenVault: tokenVaultKey,
              globalState: globalStateKey,
              mintColl: SAMO_RAY_LP_MINT,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY,
            },
          }
      ).catch(e => {
        console.log("Creating Vault Error:", e);
      });
    
      console.log("txHash =", txHash);
  
      let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
  
      assert(tokenVault.mintColl.toBase58() == SAMO_RAY_LP_MINT.toBase58(), "mintColl mismatch");
      assert(tokenVault.riskLevel == riskLevel, "riskLevel mismatch");
  
    });
    
})

