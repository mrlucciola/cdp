import * as anchor from '@project-serum/anchor';
import { StablePool } from '../target/types/stable_pool';
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';

import { TOKEN_PROGRAM_ID, Token, AccountLayout, u64 } from "@solana/spl-token";
import {use as chaiUse, assert, expect} from 'chai'    
import chaiAsPromised from 'chai-as-promised'

// orca
import Decimal from "decimal.js";
import { getOrca, OrcaFarmConfig, OrcaPoolConfig, Network, OrcaU64, ORCA_FARM_ID } from "@orca-so/sdk";
import { 
  getOrcaUserFarm, 
  getOrcaGlobalFarm, 
  getOrCreateAssociatedTokenAccountIx, 
  getAuthorityAndNonce,
  getOrCreateATokenAccountIx,
  constructConvertTokensIx,
  constructRevertTokensIx
} from "./orca/utils";

chaiUse(chaiAsPromised)

describe('orca-integration', () => {
  // Constants
  const GLOBAL_STATE_TAG = "global-state-seed";
  const TOKEN_VAULT_TAG = "token-vault-seed";
  const USER_TROVE_TAG = "user-trove-seed";
  const USD_MINT_TAG = "usd-mint";
  const USER_TROVE_POOL_TAG = "user-trove-pool";
  const ORCA_VAULT_TAG = "orca-vault-seed";
  const RATIO_ORCA_AUTH_TAG = "cdp-orca-auth";
  const TOKEN_VAULT_POOL_TAG = "token-vault-pool";

  // ORCA Farms
  const DEVNET_ORCASOL_FARM_PARAMS = Object.freeze({
    address: new PublicKey("6YrLcQs5yFvXkRY5VkMGEfVgo5rwozJf7jXedpZxbKmi"),
    farmTokenMint: new PublicKey("3z8o3b4gMBpnRsrDv7ruZPcVtgoULMFyEoEEGwTsw2TR"),
    rewardTokenMint: new PublicKey("orcarKHSqC5CDDsGbho8GKvwExejWHxTqGzXgcewB9L"),
    rewardTokenDecimals: 6,
    baseTokenMint: new PublicKey("CmDdQhusZWyi9fue27VSktYgkHefm3JXNdzc9kCpyvYi"),
    baseTokenDecimals: 6,
  });
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const stablePoolProgram = anchor.workspace.StablePool as anchor.Program<StablePool>;
  const user = anchor.web3.Keypair.fromSecretKey(new Uint8Array([104,155,54,210,140,177,188,104,40,172,169,66,101,176,231,31,72,200,64,131,208,190,48,19,88,24,120,175,211,244,81,16,29,181,197,142,71,127,186,94,168,207,50,86,7,47,213,125,181,235,122,80,133,42,230,222,120,75,5,233,201,228,120,75]));
  const superOwner = anchor.web3.Keypair.fromSecretKey(new Uint8Array([248,117,94,64,137,224,108,14,118,36,69,1,239,191,223,71,124,68,42,6,102,244,247,159,98,192,68,119,156,255,97,223,38,117,172,163,116,6,151,12,215,178,92,106,178,185,76,227,114,36,45,2,32,234,125,2,122,23,171,243,189,169,252,174]));

  let userCollKey = null;
  let userUsdxTokenAccount = null;

  const depositAmount = 100_000_000; // 0.1 LPT
  const tvlLimit = 1_000_000_000;
  const USD_DECIMAL = 6;

  console.log("superOwner =", superOwner.publicKey.toBase58());
  console.log("user =", user.publicKey.toBase58());

  const orca = getOrca(provider.connection, Network.DEVNET);

  it('Create Global State', async () => {
    
    console.log("stablePoolProgram.programId =", stablePoolProgram.programId.toBase58());
    
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

    // let data = await provider.connection.getAccountInfo(stablePoolProgram.programId);
    // console.log("data =", data);

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
        signers: [superOwner]
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
 
  it('Create ORCA/SOL Token Vault', async () => {

    let lpMint = DEVNET_ORCASOL_FARM_PARAMS.farmTokenMint;
    const [globalStateKey, globalStateNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );
    console.log("GlobalStateKey", globalStateKey.toBase58());

    const globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.toBuffer()],
        stablePoolProgram.programId,
      );
    console.log("tokenVaultKey",tokenVaultKey.toBase58());

    const riskLevel = 0;
    let txHash = await stablePoolProgram.rpc.createTokenVault(
        tokenVaultNonce, 
        riskLevel,
        {
          accounts: {
            payer: superOwner.publicKey,
            tokenVault: tokenVaultKey,
            globalState: globalStateKey,
            mintColl: lpMint,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [superOwner]
        }
    ).catch(e => {
      console.log("Creating Vault Error:", e);
    });
  
    console.log("txHash =", txHash);

    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);

    assert(tokenVault.mintColl.toBase58() == lpMint.toBase58(), "mintColl mismatch");
    assert(tokenVault.riskLevel == riskLevel, "riskLevel mismatch");

  });

  it('Create User Trove', async () => {
    
    let lpMint = DEVNET_ORCASOL_FARM_PARAMS.farmTokenMint;
    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.toBuffer()],
        stablePoolProgram.programId,
      );

    const [userTroveKey, userTroveNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
      stablePoolProgram.programId,
    );

    const [tokenCollKey, tokenCollNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_POOL_TAG), userTroveKey.toBuffer()],
        stablePoolProgram.programId,
      );

    await stablePoolProgram.rpc.createUserTrove(
      userTroveNonce, 
      tokenCollNonce, 
      {
        accounts: {
          troveOwner: user.publicKey,
          userTrove: userTroveKey,
          tokenColl: tokenCollKey,
          tokenVault: tokenVaultKey,
          mintColl: lpMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Creating UserTrove Error:", e);
    });

    let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);

    assert(userTrove.lockedCollBalance.toNumber() == 0, "lockedCollBalance mismatch");
    assert(userTrove.debt.toNumber() == 0, "debt mismatch");
  });

  
  it('Create Orca/SOL OrcaVault', async () => {

    let baseMint = DEVNET_ORCASOL_FARM_PARAMS.baseTokenMint;
    let lpMint = DEVNET_ORCASOL_FARM_PARAMS.farmTokenMint;

    const [orcaVaultKey, orcaVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(ORCA_VAULT_TAG), lpMint.toBuffer()],
        stablePoolProgram.programId,
      );
  
    const [globalStateKey, globalStateNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );
    
    await stablePoolProgram.rpc.createOrcaVault(
        0,
        orcaVaultNonce, 
      {
        accounts: {
          payer: superOwner.publicKey,
          orcaVault: orcaVaultKey,
          globalState: globalStateKey,
          baseMint: DEVNET_ORCASOL_FARM_PARAMS.baseTokenMint,
          lpMint: DEVNET_ORCASOL_FARM_PARAMS.farmTokenMint,
          ddMint: DEVNET_ORCASOL_FARM_PARAMS.farmTokenMint,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [superOwner]
      }
    ).catch(e => {
      console.log("Creating Orca Vault Error:", e);
    });

    let orcaVault = await stablePoolProgram.account.ratioOrcaVault.fetch(orcaVaultKey);
    assert(orcaVault.lpMint.equals(lpMint));
    assert(orcaVault.baseMint.equals(baseMint));
  });

  it('Swap SOL/ORCA && Liquify && Deposit LP', async () => {
      const orcaSolPool = orca.getPool(OrcaPoolConfig.ORCA_SOL);
      const swap = async () => {
        const solToken = orcaSolPool.getTokenB();
        const solAmount = new Decimal(0.2);
        const quote = await orcaSolPool.getQuote(solToken, solAmount);
        const orcaAmount = quote.getMinOutputAmount();
      
        console.log(`Swap ${solAmount.toString()} SOL for at least ${orcaAmount.toNumber()} ORCA`);
        const swapPayload = await orcaSolPool.swap(user, solToken, solAmount, orcaAmount);
        const swapTxId = await swapPayload.execute();
        console.log("Swapped:", swapTxId, "\n");
      }
      const addLiquidity = async () => {
        const solToken = orcaSolPool.getTokenB();
        const solAmount = new Decimal(0.2);
        const quote = await orcaSolPool.getQuote(solToken, solAmount);
        const orcaAmount = quote.getMinOutputAmount();
      
        const { maxTokenAIn, maxTokenBIn, minPoolTokenAmountOut } = await orcaSolPool.getDepositQuote(
          orcaAmount,
          solAmount
        );
      
        console.log(
          `Deposit at most ${maxTokenBIn.toNumber()} SOL and ${maxTokenAIn.toNumber()} ORCA, for at least ${minPoolTokenAmountOut.toNumber()} LP tokens`
        );
      
        const poolDepositPayload = await orcaSolPool.deposit(
          user,
          maxTokenAIn,
          maxTokenBIn,
          minPoolTokenAmountOut
        );
        
        const poolDepositTxId = await poolDepositPayload.execute();
        console.log("Pool deposited:", poolDepositTxId, "\n");
      }
      await swap();
      await addLiquidity();

      const lpBalance = await orcaSolPool.getLPBalance(user.publicKey);
      const orcaSolFarm = orca.getFarm(OrcaFarmConfig.ORCA_SOL_AQ);
      const farmDepositPayload = await orcaSolFarm.deposit(user, lpBalance);
      const farmDepositTxId = await farmDepositPayload.execute();
      console.log("Farm deposited:", farmDepositTxId, "\n");
  });
  it('Deposit Orca/SOL LP to CDP Vault', async () => {
    
      let baseMint = DEVNET_ORCASOL_FARM_PARAMS.baseTokenMint;
      let lpMint = DEVNET_ORCASOL_FARM_PARAMS.farmTokenMint;
      let ddMint = DEVNET_ORCASOL_FARM_PARAMS.farmTokenMint;
      
      let amount = 1; // 1 LP token
      const depositAmount = OrcaU64.fromNumber(amount, 6);
      //console.log("depositAmount = ", depositAmount.toNumber());

      const { address: globalFarmAddress, rewardTokenMint } = DEVNET_ORCASOL_FARM_PARAMS;
      let {userFarmAddress, userFarmData} = await getOrcaUserFarm(globalFarmAddress, user.publicKey);
      let globalFarmData = await getOrcaGlobalFarm(globalFarmAddress);

      let arrIx: Array<TransactionInstruction> = [];
      // init User Farm
      if (!userFarmData || !userFarmData.isInitialized) {
          throw new Error("Failed to get userFarm information");
      }

      // resolve farm token account
      let userFarmTokenPublicKey = await getOrCreateAssociatedTokenAccountIx(
        user.publicKey, globalFarmData.farmTokenMint, arrIx);
      
      // resolve reward token account
      let userRewardTokenPublicKey = await getOrCreateAssociatedTokenAccountIx(
        user.publicKey, rewardTokenMint, arrIx);
      
      // resolve base token account
      let userBaseTokenPublicKey = await getOrCreateAssociatedTokenAccountIx(
        user.publicKey, globalFarmData.baseTokenMint, arrIx);
      
      // Convert base tokens to farm tokens
      const authority = (await getAuthorityAndNonce(globalFarmAddress, ORCA_FARM_ID))[0];
      
      const [ratioAuthority, ratioAuthorityBump] = 
          await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(RATIO_ORCA_AUTH_TAG), user.publicKey.toBuffer()],
          stablePoolProgram.programId,
      );
      
      let ratioPoolTokenAccount = await getOrCreateATokenAccountIx(
          ratioAuthority,
          true,
          user.publicKey,
          globalFarmData.farmTokenMint,
          arrIx
      );
      let ratioRewardTokenAccount = await getOrCreateATokenAccountIx(
          ratioAuthority,
          true,
          user.publicKey,
          rewardTokenMint,
          arrIx
      );
      let ratioBaseTokenAccount = await getOrCreateATokenAccountIx(
          ratioAuthority,
          true,
          user.publicKey,
          globalFarmData.baseTokenMint,
          arrIx
      );

      const [tokenVaultKey, tokenVaultNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(TOKEN_VAULT_TAG), ddMint.toBuffer()],
          stablePoolProgram.programId,
        );
      const [userTroveKey, userTroveNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
          stablePoolProgram.programId,
        );
      const [orcaVaultKey, orcaVaultNonce] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(ORCA_VAULT_TAG), lpMint.toBuffer()],
          stablePoolProgram.programId,
        );
      const [globalStateKey, globalStateNonce] = 
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(GLOBAL_STATE_TAG)],
          stablePoolProgram.programId,
        );

      let {userFarmAddress: ratioUserFarmAddress, userFarmData: ratioUserFarmData} 
          = await getOrcaUserFarm(globalFarmAddress, ratioAuthority);
      // init User Farm
      if (!ratioUserFarmData || !ratioUserFarmData.isInitialized) {

          let ORCA_FARM_SIZE = 110;
          arrIx.push(SystemProgram.transfer({
            fromPubkey: user.publicKey,
            toPubkey: ratioAuthority,
            lamports: await provider.connection.getMinimumBalanceForRentExemption(ORCA_FARM_SIZE)
          }));

          arrIx.push(stablePoolProgram.instruction.initOrcaFarm(
            ratioAuthorityBump, {
                accounts: {
                  payer: user.publicKey,
                  globalFarm: globalFarmAddress,
                  ratioUserFarm: ratioUserFarmAddress,
                  ratioOrcaAuthority: ratioAuthority,
                  orcaFarmProgram: ORCA_FARM_ID,
                  systemProgram: SystemProgram.programId
                }
            }
          ))
      }

      arrIx.push(constructRevertTokensIx(
        user.publicKey,
        user.publicKey,
        ratioBaseTokenAccount,
        userFarmTokenPublicKey,
        userRewardTokenPublicKey,
        globalFarmData.baseTokenVault,
        globalFarmData.farmTokenMint,
        globalFarmAddress,
        userFarmAddress,
        globalFarmData.rewardTokenVault,
        authority,
        ORCA_FARM_ID,
        depositAmount.toU64()
      ))

      let prevUserlp_amount = await provider.connection.getTokenAccountBalance(userFarmTokenPublicKey);

      let signedTransaction = await stablePoolProgram.rpc.depositOrcaLp(
        depositAmount.toU64(),
        ratioAuthorityBump,
        {
          accounts: {
              owner: user.publicKey,
              ratioAuthority: ratioAuthority,
              globalState: globalStateKey,
              userTrove: userTroveKey,
              tokenVault: tokenVaultKey,
              ratioOrcaVault: orcaVaultKey,
              ratioBaseTokenAccount,
              ratioPoolTokenAccount,
              poolTokenMint: globalFarmData.farmTokenMint,
              ratioRewardTokenAccount,
              globalFarm: globalFarmAddress,
              ratioUserFarm: ratioUserFarmAddress,
              orcaRewardVault: globalFarmData.rewardTokenVault,
              orcaBaseVault: globalFarmData.baseTokenVault,
              authority: authority,
              orcaFarmProgram: ORCA_FARM_ID,
              tokenProgram: TOKEN_PROGRAM_ID
          },
          instructions: [...arrIx],
          signers: [user]
        }
      );

    await provider.connection.confirmTransaction(signedTransaction, 'processed');
    console.log("Farm deposited:", signedTransaction);

    let userlp_amount = await provider.connection.getTokenAccountBalance(userFarmTokenPublicKey);
    let ratiolp_amount = await provider.connection.getTokenAccountBalance(ratioPoolTokenAccount);
    console.log("userlp_amount =", userlp_amount.value.uiAmount);
    console.log("ratiolp_amount =", ratiolp_amount.value.uiAmount);
    assert(prevUserlp_amount.value.uiAmount - userlp_amount.value.uiAmount == 1);
  })

  it('Withdraw Orca/SOL LP from Orca/SOL Farm', async () => {
    
    let rewardMint = DEVNET_ORCASOL_FARM_PARAMS.rewardTokenMint;
    let lpMint = DEVNET_ORCASOL_FARM_PARAMS.farmTokenMint;
    let ddMint = DEVNET_ORCASOL_FARM_PARAMS.farmTokenMint;
    
    let amount = 1; // 1 LP token
    const depositAmount = OrcaU64.fromNumber(amount, 6);
    console.log("depositAmount = ", depositAmount.toNumber());

    const { address: globalFarmAddress, rewardTokenMint } = DEVNET_ORCASOL_FARM_PARAMS;
    let {userFarmAddress, userFarmData} = await getOrcaUserFarm(globalFarmAddress, user.publicKey);
    let globalFarmData = await getOrcaGlobalFarm(globalFarmAddress);

    let arrIx: Array<TransactionInstruction> = [];
    // init User Farm
    if (!userFarmData || !userFarmData.isInitialized) {
        throw new Error("Failed to get userFarm information");
    }
    // resolve farm token account
    let userFarmTokenPublicKey = await getOrCreateAssociatedTokenAccountIx(
      user.publicKey, globalFarmData.farmTokenMint, arrIx);
    
    // resolve reward token account
    let userRewardTokenPublicKey = await getOrCreateAssociatedTokenAccountIx(
      user.publicKey, rewardTokenMint, arrIx);
    
    // resolve base token account
    let userBaseTokenPublicKey = await getOrCreateAssociatedTokenAccountIx(
      user.publicKey, globalFarmData.baseTokenMint, arrIx);
    
    // Convert base tokens to farm tokens
    const authority = (await getAuthorityAndNonce(globalFarmAddress, ORCA_FARM_ID))[0];
    
    const [ratioAuthority, ratioAuthorityBump] = 
        await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(RATIO_ORCA_AUTH_TAG), user.publicKey.toBuffer()],
        stablePoolProgram.programId,
    );
    let ratioPoolTokenAccount = await getOrCreateATokenAccountIx(
        ratioAuthority,
        true,
        user.publicKey,
        globalFarmData.farmTokenMint,
        arrIx
    );
    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), ddMint.toBuffer()],
        stablePoolProgram.programId,
      );
    const [userTroveKey, userTroveNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );
    const [orcaVaultKey, orcaVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(ORCA_VAULT_TAG), lpMint.toBuffer()],
        stablePoolProgram.programId,
      );
    const [globalStateKey, globalStateNonce] = 
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );
    let {userFarmAddress: ratioUserFarmAddress, userFarmData: ratioUserFarmData} 
        = await getOrcaUserFarm(globalFarmAddress, ratioAuthority);

    arrIx.push(stablePoolProgram.instruction.withdrawOrcaLp(
      depositAmount.toU64(),
      ratioAuthorityBump,
      {
        accounts: {
            owner: user.publicKey,
            ratioAuthority: ratioAuthority,
            globalState: globalStateKey,
            userTrove: userTroveKey,
            tokenVault: tokenVaultKey,
            ratioOrcaVault: orcaVaultKey,
            userBaseTokenAccount: userBaseTokenPublicKey,
            ratioPoolTokenAccount,
            poolTokenMint: globalFarmData.farmTokenMint,
            userRewardTokenAccount: userRewardTokenPublicKey,
            globalFarm: globalFarmAddress,
            ratioUserFarm: ratioUserFarmAddress,
            orcaRewardVault: globalFarmData.rewardTokenVault,
            orcaBaseVault: globalFarmData.baseTokenVault,
            authority: authority,
            orcaFarmProgram: ORCA_FARM_ID,
            tokenProgram: TOKEN_PROGRAM_ID
        }
      }
    ));
  
    arrIx.push(constructConvertTokensIx(
      user.publicKey,
      user.publicKey,
      userBaseTokenPublicKey,
      userFarmTokenPublicKey,
      userRewardTokenPublicKey,
      globalFarmData.baseTokenVault,
      globalFarmData.farmTokenMint,
      globalFarmAddress,
      userFarmAddress,
      globalFarmData.rewardTokenVault,
      authority,
      ORCA_FARM_ID,
      depositAmount.toU64()
    ))
    
    let prevUserlp_amount = await provider.connection.getTokenAccountBalance(userFarmTokenPublicKey);
    let tx = await provider.connection.sendTransaction(new Transaction().add(...arrIx), [user]);
    await provider.connection.confirmTransaction(tx, 'processed');
    console.log("Farm deposited:", tx);

    let userlp_amount = await provider.connection.getTokenAccountBalance(userFarmTokenPublicKey);
    let ratiolp_amount = await provider.connection.getTokenAccountBalance(ratioPoolTokenAccount);
    console.log("userlp_amount =", userlp_amount.value.uiAmount);
    console.log("ratiolp_amount =", ratiolp_amount.value.uiAmount);
    assert(userlp_amount.value.uiAmount - prevUserlp_amount.value.uiAmount == 1);
  })

  it('Harvest reward from Orca/SOL Farm', async () => {
    const { address: globalFarmAddress, rewardTokenMint } = DEVNET_ORCASOL_FARM_PARAMS;
    let globalFarmData = await getOrcaGlobalFarm(globalFarmAddress);
    let arrIx: Array<TransactionInstruction> = [];

    // resolve farm token account
    let userFarmTokenPublicKey = await getOrCreateAssociatedTokenAccountIx(
      user.publicKey, globalFarmData.farmTokenMint, arrIx);
    
    // resolve reward token account
    let userRewardTokenPublicKey = await getOrCreateAssociatedTokenAccountIx(
      user.publicKey, rewardTokenMint, arrIx);
    
    // Convert base tokens to farm tokens
    const authority = (await getAuthorityAndNonce(globalFarmAddress, ORCA_FARM_ID))[0];
    
    const [ratioAuthority, ratioAuthorityBump] = 
      await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(RATIO_ORCA_AUTH_TAG), user.publicKey.toBuffer()],
      stablePoolProgram.programId,
    );
    const [globalStateKey, globalStateNonce] = 
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );
    let ratioPoolTokenAccount = await getOrCreateATokenAccountIx(
        ratioAuthority,
        true,
        user.publicKey,
        globalFarmData.farmTokenMint,
        arrIx
    );
    
    let {userFarmAddress: ratioUserFarmAddress, userFarmData: ratioUserFarmData} 
        = await getOrcaUserFarm(globalFarmAddress, ratioAuthority);

    let prevUserReward = await provider.connection.getTokenAccountBalance(userRewardTokenPublicKey);
    let signedTransaction = await stablePoolProgram.rpc.harvestReward(
      ratioAuthorityBump,
      {
        accounts: {
            owner: user.publicKey,
            ratioAuthority: ratioAuthority,
            globalState: globalStateKey,
            userRewardTokenAccount: userRewardTokenPublicKey,
            globalFarm: globalFarmAddress,
            ratioUserFarm: ratioUserFarmAddress,
            orcaRewardVault: globalFarmData.rewardTokenVault,
            orcaBaseVault: globalFarmData.baseTokenVault,
            authority: authority,
            orcaFarmProgram: ORCA_FARM_ID,
            tokenProgram: TOKEN_PROGRAM_ID
        },
        instructions: [...arrIx],
        signers: [user]
      }
    );
    await provider.connection.confirmTransaction(signedTransaction, 'processed');
    console.log("Farm deposited:", signedTransaction, "\n");

    let userReward = await provider.connection.getTokenAccountBalance(userRewardTokenPublicKey);
    let userlp_amount = await provider.connection.getTokenAccountBalance(userFarmTokenPublicKey);
    let ratiolp_amount = await provider.connection.getTokenAccountBalance(ratioPoolTokenAccount);
    console.log("userlp_amount =", userlp_amount.value.uiAmount);
    console.log("ratiolp_amount =", ratiolp_amount.value.uiAmount);
    assert(userReward >= prevUserReward);
  })
});