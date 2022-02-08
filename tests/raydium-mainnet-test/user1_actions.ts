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


describe('user1_actions', () => {
    // Constants
    const GLOBAL_STATE_TAG = "global-state-seed";
    const TOKEN_VAULT_TAG = "token-vault-seed";
    const USER_TROVE_TAG = "user-trove";
    const USD_MINT_TAG = "usd-mint";
    const USD_TOKEN_TAG = "usd-token";
    const USER_TROVE_POOL_TAG = "user-trove-pool";

    const USER_TROVE_REWARD_A_TAG = "user-trove-reward-a";
    const USER_TROVE_REWARD_B_TAG = "user-trove-reward-b";

    // Configure the client to use the local cluster.
    const superOwner = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
    const user1 = anchor.web3.Keypair.fromSecretKey(Buffer.from(USER1_WALLET))

    const provider = anchor.Provider.env();
    const superOwnerProvider = new anchor.Provider(provider.connection, new anchor.Wallet(superOwner), {});
    const user1Provider = new anchor.Provider(provider.connection, new anchor.Wallet(user1), {});

    anchor.setProvider(user1Provider);
    let stablePoolProgram = anchor.workspace.StablePool as anchor.Program<StablePool>;

    const RAYDIUM_PROGRAM_ID = new anchor.web3.PublicKey("9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z");
    
    // SAMO-RAY FARM test info
    const SAMO_RAY_LP_MINT = new anchor.web3.PublicKey("HwzkXyX8B45LsaHXwY8su92NoRBS5GQC32HzjQRDqPnr");
    const USER1_SAMO_RAY_LP_ATA = new anchor.web3.PublicKey("74iCsHch8jEaZpV9J2K85ybkVZ5TQbQ342HH4HjUk2f3");
    const USER1_SAMO_REWARD_B_ATA = new anchor.web3.PublicKey("HhdtMgw9URicKeaXHqrENZasYok8VYsshJhhj5JeFgfa");
    const USER1_RAY_ATA = new anchor.web3.PublicKey("4j5EU9qDok3giCid8ygAXDFZ8W8Sw5gUVtqmB8WqWFLS");
    const SAMO_MINT = new anchor.web3.PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
    const RAY_MINT = new anchor.web3.PublicKey("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R");

    const SAMO_RAY_POOL_ID = new anchor.web3.PublicKey("Bw932pURVJRYjEJwRZGWjfUNpeyz18kjMNdb833eMxoj");
    const SAMO_RAY_POOL_AUTHORITY = new anchor.web3.PublicKey("FzTbGLdzgWCRkq8hbS8tLf5HjfU7JzUbtRmTkjGQB9Vz");
    
    const SAMO_RAY_POOL_LP_VAULT = new anchor.web3.PublicKey("GUVKfYMiGEyp41CUw2j2NsoQJ5zDQ3Q6uSdApM8W46Ba");
    const SAMO_POOL_REWARD_B_VAULT = new anchor.web3.PublicKey("GhctEMRSwvdZF7aFeCLdK9X1sAAeGVPjr12iVLjQNvhy");
    const RAY_POOL_REWARD_A_VAULT = new anchor.web3.PublicKey("J99YW5wnfgBJcG17BgSbp1S8RNJ39JAb7kg9RGHyb3Hq");

    // MEAN-RAY FARM test info (Dual Farm)

    const tvlLimit = 1_000_000_000;
    
    it('Create User Trove', async () => {
      const [tokenVaultKey, tokenVaultNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(TOKEN_VAULT_TAG), SAMO_RAY_LP_MINT.toBuffer()],
          stablePoolProgram.programId,
        );
  
      const [userTroveKey, userTroveNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user1.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );
  
      const [tokenCollKey, tokenCollNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(USER_TROVE_POOL_TAG), userTroveKey.toBuffer()],
          stablePoolProgram.programId,
        );
      const [userTroveAssociatedInfoKey] =
        await anchor.web3.PublicKey.findProgramAddress(
          [SAMO_RAY_POOL_ID.toBuffer(), userTroveKey.toBuffer(), Buffer.from('staker_info_v2_associated_seed')],
          RAYDIUM_PROGRAM_ID,
        );
      const createRaydiumUserAccountInstruction = stablePoolProgram.instruction.createRaydiumUserAccount(
        userTroveNonce,
        {
          accounts: {
            owner: user1.publicKey,
            userTrove: userTroveKey,
            tokenVault: tokenVaultKey,
            raydiumProgramId: RAYDIUM_PROGRAM_ID,
            raydiumPoolId: SAMO_RAY_POOL_ID,
            userTroveAssociatedInfoAccount: userTroveAssociatedInfoKey,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          }
        }
      )
      const tx = await stablePoolProgram.rpc.createUserTrove(
        userTroveNonce, 
        tokenCollNonce, 
        {
          accounts: {
            authority: user1.publicKey,
            userTrove: userTroveKey,
            tokenColl: tokenCollKey,
            tokenVault: tokenVaultKey,
            mintColl: SAMO_RAY_LP_MINT,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          instructions: [createRaydiumUserAccountInstruction]
        }
      ).catch(e => {
        console.log("Creating UserTrove Error:", e);
      });
      console.log("tx = ",tx)
  
      let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    });
    it('Deposit Raydium Collateral', async () => {
      
      const depositAmount = 1_000_000; 
      const [globalStateKey, globalStateNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(GLOBAL_STATE_TAG)],
          stablePoolProgram.programId,
        );
      let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
  
      const [tokenVaultKey, tokenVaultNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(TOKEN_VAULT_TAG), SAMO_RAY_LP_MINT.toBuffer()],
          stablePoolProgram.programId,
        );
  
      
      const [userTroveKey, userTroveNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user1.publicKey.toBuffer()],
          stablePoolProgram.programId,
        );
      const [tokenCollKey, tokenCollNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(USER_TROVE_POOL_TAG), userTroveKey.toBuffer()],
          stablePoolProgram.programId,
        );
      const [userTroveRewardTokenAKey, userTroveRewardTokenANonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(USER_TROVE_REWARD_A_TAG), userTroveKey.toBuffer()],
          stablePoolProgram.programId,
        );
      const [userTroveRewardTokenBKey, userTroveRewardTokenBNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(USER_TROVE_REWARD_B_TAG), userTroveKey.toBuffer()],
          stablePoolProgram.programId,
        );
      const [userTroveAssociatedInfoKey] =
        await anchor.web3.PublicKey.findProgramAddress(
          [SAMO_RAY_POOL_ID.toBuffer(), userTroveKey.toBuffer(), Buffer.from('staker_info_v2_associated_seed')],
          RAYDIUM_PROGRAM_ID,
        );

      let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
      let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
      let totalAmount = tokenVault.totalColl.toNumber()
      let userAmount = userTrove.lockedCollBalance.toNumber()

      
      const createRewardVaultsInstruction = stablePoolProgram.instruction.createRaydiumV5RewardVaults(
        userTroveRewardTokenANonce,
        userTroveRewardTokenBNonce,
        {
          accounts: {
            owner: user1.publicKey,
            userTrove: userTroveKey,
            tokenVault: tokenVaultKey,
            rewardMintA: RAY_MINT,
            rewardMintB: SAMO_MINT,
            userTroveRewardTokenA: userTroveRewardTokenAKey,
            userTroveRewardTokenB: userTroveRewardTokenBKey,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID
          }
        }
      )
      const tx = await stablePoolProgram.rpc.depositRaydiumV5Collateral(
        new anchor.BN(depositAmount),
        {
          accounts: {
            owner: user1.publicKey,
            userTrove: userTroveKey,
            tokenVault: tokenVaultKey,
            userTroveTokenColl: tokenCollKey,
            userTokenColl: USER1_SAMO_RAY_LP_ATA,
            userTroveRewardTokenA: userTroveRewardTokenAKey,
            userTroveRewardTokenB: userTroveRewardTokenBKey,

            raydiumProgramId: RAYDIUM_PROGRAM_ID,
            raydiumPoolId: SAMO_RAY_POOL_ID,
            raydiumPoolAuthority: SAMO_RAY_POOL_AUTHORITY,
            userTroveAssociatedInfoAccount: userTroveAssociatedInfoKey,
            raydiumPoolLpAccount: SAMO_RAY_POOL_LP_VAULT,
            raydiumPoolRewardTokenAAccount: RAY_POOL_REWARD_A_VAULT,
            raydiumPoolRewardTokenBAccount: SAMO_POOL_REWARD_B_VAULT,
            userRewardTokenAAccount: USER1_RAY_ATA,
            userRewardTokenBAccount: USER1_SAMO_REWARD_B_ATA,

            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
          instructions:[createRewardVaultsInstruction]
        }
      ).catch(e => {
        console.log("Deposit Raydium Collateral Error:", e);
      });
      console.log("tx = ",tx)

      // console.log("----------------------------------------")
      // console.log(RAYDIUM_PROGRAM_ID.toBase58())
      // console.log(SAMO_RAY_POOL_ID.toBase58())
      // console.log(SAMO_RAY_POOL_AUTHORITY.toBase58())
      // console.log(userTroveAssociatedInfoKey.toBase58())
      // console.log(userTroveKey.toBase58())
      // console.log(tokenCollKey.toBase58())
      // console.log(SAMO_RAY_POOL_LP_VAULT.toBase58())
      // console.log(userTroveRewardTokenAKey.toBase58())
      // console.log(RAY_POOL_REWARD_A_VAULT.toBase58())
      // console.log(SYSVAR_CLOCK_PUBKEY.toBase58())
      // console.log(TOKEN_PROGRAM_ID.toBase58())
      // console.log(userTroveRewardTokenBKey.toBase58())
      // console.log(SAMO_POOL_REWARD_B_VAULT.toBase58())
      // console.log("----------------------------------------")
  
      userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
      tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
      globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
      let totalAmountAfter = tokenVault.totalColl.toNumber()
      let userAmountAfter = userTrove.lockedCollBalance.toNumber()
      console.log("total ",tokenVault.totalColl.toNumber(),"deposited")
      console.log("user ",userTrove.lockedCollBalance.toNumber(),"deposited")

      assert(totalAmountAfter - totalAmount == depositAmount,
         "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
      assert(userAmountAfter - userAmount == depositAmount, 
          "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
      
    });
    it('Withdraw Raydium Collateral', async () => {
      const withdrawAmount = 1_000_000; 
      const [globalStateKey, globalStateNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(GLOBAL_STATE_TAG)],
          stablePoolProgram.programId,
        );
      let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
  
      const [tokenVaultKey, tokenVaultNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(TOKEN_VAULT_TAG), SAMO_RAY_LP_MINT.toBuffer()],
          stablePoolProgram.programId,
        );
  
      
      const [userTroveKey, userTroveNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user1.publicKey.toBuffer()],
          stablePoolProgram.programId,
        );
      const [tokenCollKey, tokenCollNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(USER_TROVE_POOL_TAG), userTroveKey.toBuffer()],
          stablePoolProgram.programId,
        );
      const [userTroveRewardTokenAKey, userTroveRewardTokenANonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(USER_TROVE_REWARD_A_TAG), userTroveKey.toBuffer()],
          stablePoolProgram.programId,
        );
      const [userTroveRewardTokenBKey, userTroveRewardTokenBNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(USER_TROVE_REWARD_B_TAG), userTroveKey.toBuffer()],
          stablePoolProgram.programId,
        );
  
      const [userTroveAssociatedInfoKey] =
        await anchor.web3.PublicKey.findProgramAddress(
          [SAMO_RAY_POOL_ID.toBuffer(), userTroveKey.toBuffer(), Buffer.from('staker_info_v2_associated_seed')],
          RAYDIUM_PROGRAM_ID,
        );
      let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
      let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);

      let totalAmount = tokenVault.totalColl.toNumber()
      let userAmount = userTrove.lockedCollBalance.toNumber()
      const tx = await stablePoolProgram.rpc.withdrawRaydiumV5Collateral(
        new anchor.BN(withdrawAmount),
        {
          accounts: {
            owner: user1.publicKey,
            userTrove: userTroveKey,
            tokenVault: tokenVaultKey,
            userTroveTokenColl: tokenCollKey,
            userTokenColl: USER1_SAMO_RAY_LP_ATA,
            userTroveRewardTokenA: userTroveRewardTokenAKey,
            userTroveRewardTokenB: userTroveRewardTokenBKey,

            raydiumProgramId: RAYDIUM_PROGRAM_ID,
            raydiumPoolId: SAMO_RAY_POOL_ID,
            raydiumPoolAuthority: SAMO_RAY_POOL_AUTHORITY,
            userTroveAssociatedInfoAccount: userTroveAssociatedInfoKey,
            raydiumPoolLpAccount: SAMO_RAY_POOL_LP_VAULT,
            raydiumPoolRewardTokenAAccount: RAY_POOL_REWARD_A_VAULT,
            raydiumPoolRewardTokenBAccount: SAMO_POOL_REWARD_B_VAULT,
            userRewardTokenAAccount: USER1_RAY_ATA,
            userRewardTokenBAccount: USER1_SAMO_REWARD_B_ATA,

            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
        }
      ).catch(e => {
        console.log("Withdraw Raydium Collateral Error:", e);
      });
      console.log("tx = ",tx)
  
      userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
      tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
      globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

      let totalAmountAfter = tokenVault.totalColl.toNumber()
      let userAmountAfter = userTrove.lockedCollBalance.toNumber()
      console.log("total ",tokenVault.totalColl.toNumber(),"deposited")
      console.log("user ",userTrove.lockedCollBalance.toNumber(),"deposited")

      assert(totalAmount - totalAmountAfter == withdrawAmount,
         "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
      assert(userAmount - userAmountAfter == withdrawAmount, 
          "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
      
    });
})

