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
import { token } from '@project-serum/anchor/dist/cjs/utils';
chaiUse(chaiAsPromised)

async function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

describe('ratio', () => {

  // Constants
  const GLOBAL_STATE_TAG = "global-state-seed";
  const TOKEN_VAULT_TAG = "token-vault-seed";
  const USER_TROVE_TAG = "user-trove";
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
  const globalDebtCeiling = 15_000_000;
  const vaultDebtCeiling = 10_000_000;
  const USD_DECIMAL = 6;

  console.log("superOwner =", superOwner.publicKey.toBase58());
  console.log("user =", user.publicKey.toBase58());

  it('Is initialized!', async () => {
    /*while (await provider.connection.getBalance(superOwner.publicKey) == 0){
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
    };*/
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
  });

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
    ).catch(e => {
      console.log("e =", e);
    });
    console.log("txHash =", txHash);

    const globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(globalState.superOwner.toBase58() == superOwner.publicKey.toBase58());
    assert(globalState.mintUsd.toBase58() == mintUsdKey.toBase58());
    assert(globalState.tvlLimit.toNumber() == tvlLimit, "GlobalState TVL Limit: " + globalState.tvlLimit + " TVL Limit: " + tvlLimit);
    assert(globalState.tvl.toNumber() == 0);
    assert(globalState.totalDebt.toNumber() == 0);
    assert(globalState.debtCeiling.toNumber() == globalDebtCeiling, "GlobalState Debt Ceiling: " + globalState.debtCeiling + " Debt Ceiling: " + globalDebtCeiling);

  });
 
  it('Only the super owner can create token vaults', async () => {
    try{
      // Request Airdrop for superOwner & user
    }
    catch{}
    const [globalStateKey, globalStateNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );

    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const riskLevel = 0;
    const isDual = 0;
    
    const createVaultCall = async ()=>{
      await stablePoolProgram.rpc.createTokenVault(
        tokenVaultNonce, 
        riskLevel,
        isDual,
        new anchor.BN(vaultDebtCeiling),
        {
          accounts: {
            payer: user.publicKey,
            tokenVault: tokenVaultKey,
            globalState: globalStateKey,
            mintColl: lpMint.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [user]
        });
    };

    await assert.isRejected(createVaultCall(), /A raw constraint was violated/, "No error was thrown when trying to create a vault with a user different than the super owner");

    await assert.isRejected(stablePoolProgram.account.tokenVault.fetch(tokenVaultKey), /Account does not exist /, "Fetching a vault that shouldn't had been created did not throw an error");
  });
 
  it('Only the super owner can create token vaults', async () => {
    try{
      // Request Airdrop for superOwner & user
    }
    catch{}
    const [globalStateKey, globalStateNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );

    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const riskLevel = 0;
    const isDual = 0;
    
    const createVaultCall = async ()=>{
      await stablePoolProgram.rpc.createTokenVault(
        tokenVaultNonce, 
        riskLevel,
        isDual,
        new anchor.BN(vaultDebtCeiling),
        {
          accounts: {
            payer: user.publicKey,
            tokenVault: tokenVaultKey,
            globalState: globalStateKey,
            mintColl: lpMint.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [user]
        });
    };

    await assert.isRejected(createVaultCall(), /A raw constraint was violated/, "No error was thrown when trying to create a vault with a user different than the super owner");

    await assert.isRejected(stablePoolProgram.account.tokenVault.fetch(tokenVaultKey), /Account does not exist /, "Fetching a vault that shouldn't had been created did not throw an error");
  });

  it('Create Token Vault', async () => {

    const [globalStateKey, globalStateNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );
    const globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );
    console.log("tokenVaultKey",tokenVaultKey.toBase58());

    const riskLevel = 0;
    const isDual = 0;
    let txHash = await stablePoolProgram.rpc.createTokenVault(
        tokenVaultNonce, 
        riskLevel,
        isDual,
        new anchor.BN(vaultDebtCeiling),
        {
          accounts: {
            payer: superOwner.publicKey,
            tokenVault: tokenVaultKey,
            globalState: globalStateKey,
            mintColl: lpMint.publicKey,
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

    assert(tokenVault.mintColl.toBase58() == lpMint.publicKey.toBase58(), "mintColl mismatch");
    assert(tokenVault.totalColl.toNumber() == 0, "totalColl mismatch");
    assert(tokenVault.totalDebt.toNumber() == 0, "totalDebt mismatch");
    assert(tokenVault.debtCeiling.toNumber() == vaultDebtCeiling, "Vault Debt Ceiling: " + tokenVault.debtCeiling + " Debt Ceiling: " + globalDebtCeiling);
    assert(tokenVault.riskLevel == riskLevel, "riskLevel mismatch");

  });

  it('Create Token Vault fails if globalState is not created', async () => {

    const localUser = anchor.web3.Keypair.generate();
    while (await provider.connection.getBalance(localUser.publicKey) == 0){
      try{
        // Request Airdrop for user
        await provider.connection.confirmTransaction(
          await provider.connection.requestAirdrop(localUser.publicKey, 1000000000),
          "confirmed"
        );
      }catch{}
      
    };
    
    const [globalStateKey, globalStateNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [localUser.publicKey.toBuffer(), Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );

    console.log("Checking if global state exists");
    await assert.isRejected(stablePoolProgram.account.globalState.fetch(globalStateKey), /Account does not exist /, "The global state exists");
    
    const localLpMint = await Token.createMint(
      provider.connection,
      localUser,
      localUser.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );

    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), localLpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const riskLevel = 0;
    const isDual = 0;
    const createVaultCall = async ()=>{
      console.log("Calling createVault");
      await stablePoolProgram.rpc.createTokenVault(
        tokenVaultNonce, 
        riskLevel,
        isDual,
        new anchor.BN(vaultDebtCeiling),
        {
          accounts: {
            payer: localUser.publicKey,
            tokenVault: tokenVaultKey,
            globalState: globalStateKey,
            mintColl: localLpMint.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [localUser]
        });
    };

    await expect(createVaultCall(),"No error was thrown when trying to create a vault without a global state created").is.rejected;

    console.log("Confirming vault was not created");
    await assert.isRejected(stablePoolProgram.account.tokenVault.fetch(tokenVaultKey), /Account does not exist /, "Fetching a vault that shouldn't had been created did not throw an error");
  });

  it('Create User Trove', async () => {
    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
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
          mintColl: lpMint.publicKey,
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

  it('Deposit Collateral', async () => {

    const [globalStateKey, globalStateNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );
    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
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

    
    await stablePoolProgram.rpc.depositCollateral(
      new anchor.BN(depositAmount),
      {
        accounts: {
          owner: user.publicKey,
          userTrove: userTroveKey,
          tokenVault: tokenVaultKey,
          poolTokenColl: tokenCollKey,
          userTokenColl: userCollKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: globalStateKey,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Deposit Collateral Error:", e);
    });

    let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalColl.toNumber() == depositAmount,
       "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(userTrove.lockedCollBalance.toNumber() == depositAmount, 
        "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
    assert(globalState.tvl.toNumber() == depositAmount,
        "tvl mistmatch: tvl = " + globalState.tvl);
    
    let poolLpTokenAccount = await lpMint.getAccountInfo(tokenCollKey);
    let userLpTokenAccount = await lpMint.getAccountInfo(userCollKey);

    console.log("poolLpTokenAccount.amount =", poolLpTokenAccount.amount.toString());
    console.log("userLpTokenAccount.amount =", userLpTokenAccount.amount.toString());
  });


  it('Borrow USD', async () => {

    const [globalStateKey, globalStateNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );
      
    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const [userTroveKey, userTroveNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const [mintUsdKey, mintUsdNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USD_MINT_TAG)],
        stablePoolProgram.programId,
      );

    const [userUsdKey, userUsdNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USD_TOKEN_TAG), user.publicKey.toBuffer(), mintUsdKey.toBuffer()],
        stablePoolProgram.programId,
      );

    let amount = 10_000_000; // 10 USDx

    const txHash = await stablePoolProgram.rpc.borrowUsd(
      new anchor.BN(amount), 
      userUsdNonce,
      {
        accounts: {
          owner: user.publicKey,
          tokenVault: tokenVaultKey,
          userTrove: userTroveKey,
          globalState: globalStateKey,
          mintUsd: mintUsdKey,
          userTokenUsd: userUsdKey,
          mintColl: lpMint.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Borrow USD Error:", e);
    });

    let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    console.log("userTrove.debt =", userTrove.debt.toString());
    console.log("userTrove.lastMintTime =", userTrove.lastMintTime);
    console.log("tokenVault.total_debt =", tokenVault.totalDebt.toString());

    assert(tokenVault.totalDebt.toNumber() == amount, "Vault Total Debt: " + tokenVault.totalDebt + "Expected Debt: " + amount);
    assert(globalState.totalDebt.toNumber() == amount, "Global Total Debt: " + tokenVault.totalDebt + "Expected Debt: " + amount);
    assert(userTrove.debt.toNumber() == amount, "User Trove Debt: " + userTrove.debt + "Expected Debt: " + amount);
    assert(tokenVault.totalDebt <= tokenVault.debtCeiling, "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional");
    assert(globalState.totalDebt <= globalState.debtCeiling, "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional");

  });

  it('Repay USD', async () => {
    const [globalStateKey, globalStateNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );
      
    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );
    const [userTroveKey, userTroveNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
      stablePoolProgram.programId,
    );
    const [mintUsdKey, mintUsdNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USD_MINT_TAG)],
        stablePoolProgram.programId,
      );
    
    const [userUsdKey, userUsdNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USD_TOKEN_TAG), user.publicKey.toBuffer(), mintUsdKey.toBuffer()],
        stablePoolProgram.programId,
      );

    let amount = 10_000_000; // 10 USDx
    const txHash = await stablePoolProgram.rpc.repayUsd(
      new anchor.BN(amount), 
      {
        accounts: {
          owner: user.publicKey,
          tokenVault: tokenVaultKey,
          userTrove: userTroveKey,
          globalState: globalStateKey,
          mintUsd: mintUsdKey,
          userTokenUsd: userUsdKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Repay USD Error:", e);
    });

    let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalDebt.toNumber() == 0, "Vault Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + 0);
    assert(globalState.totalDebt.toNumber() == 0, "Global Total Debt: " + tokenVault.totalDebt + "Expected Debt: " + 0);
    assert(userTrove.debt.toNumber() == 0, "User Trove Debt: " + userTrove.debt + "Expected Debt: " + 0);
    assert(tokenVault.totalDebt <= tokenVault.debtCeiling, "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional");
    assert(globalState.totalDebt < globalState.debtCeiling, "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional");
  });

  it('Withdraw Collateral', async () => {
    const [globalStateKey, globalStateNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );
    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
    console.log("fetched globalState", globalState);

    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
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

    const txHash = await stablePoolProgram.rpc.withdrawCollateral(
      new anchor.BN(depositAmount), 
      {
        accounts: {
          owner: user.publicKey,
          userTrove: userTroveKey,
          tokenVault: tokenVaultKey,
          poolTokenColl: tokenCollKey,
          userTokenColl: userCollKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: globalStateKey,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Withdraw Collateral Error:", e);
    });

    let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalColl.toNumber() == 0,
       "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(userTrove.lockedCollBalance.toNumber() == 0, 
        "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
    assert(globalState.tvl.toNumber() == 0,
        "tvl mistmatch: tvl = " + globalState.tvl);

    let poolLpTokenAccount = await lpMint.getAccountInfo(tokenCollKey);
    let userLpTokenAccount = await lpMint.getAccountInfo(userCollKey);

    console.log("poolLpTokenAccount.amount =", poolLpTokenAccount.amount.toString());
    console.log("userLpTokenAccount.amount =", userLpTokenAccount.amount.toString());
  });

  it('Set Global Debt Ceiling', async () => {
    const newGlobalDebtCeiling = 5_000_000;
    const [globalStateKey, globalStateNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(GLOBAL_STATE_TAG)],
      stablePoolProgram.programId,
    );
    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    let txHash = await stablePoolProgram.rpc.setGlobalDebtCeiling(
      new anchor.BN(newGlobalDebtCeiling),
      {
        accounts: {
          payer: superOwner.publicKey,
          globalState: globalStateKey,
        },
        signers: [superOwner]
      }
    ).catch(e => {
      console.log("Setting Global Debt Ceiling Error:", e);
    });

    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(globalState.debtCeiling.toNumber() == newGlobalDebtCeiling, "Global Debt Ceiling: " + globalState.debtCeiling.toNumber() + " Expected Debt Ceiling: " + newGlobalDebtCeiling);

    // Reverting to original global debt ceiling
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    txHash = await stablePoolProgram.rpc.setGlobalDebtCeiling(
      new anchor.BN(globalDebtCeiling),
      {
        accounts: {
          payer: superOwner.publicKey,
          globalState: globalStateKey,
        },
        signers: [superOwner]
      }
    ).catch(e => {
      console.log("Setting Global Debt Ceiling Error:", e);
    });

    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(globalState.debtCeiling.toNumber() == globalDebtCeiling, "Global Debt Ceiling: " + globalState.debtCeiling.toNumber() + " Expected Debt Ceiling: " + globalDebtCeiling);
  });

  it('Set Vault Debt Ceiling', async () => {
    const newVaultDebtCeiling = 5_000_000;
    const [globalStateKey, globalStateNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(GLOBAL_STATE_TAG)],
      stablePoolProgram.programId,
    );
    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );

    let txHash = await stablePoolProgram.rpc.setVaultDebtCeiling(
      new anchor.BN(newVaultDebtCeiling),
      {
        accounts: {
          payer: superOwner.publicKey,
          globalState: globalStateKey,
          mintColl: lpMint.publicKey,
          tokenVault: tokenVaultKey,
        },
        signers: [superOwner]
      }
    ).catch(e => {
      console.log("Setting Vault Debt Ceiling Error:", e);
    });

    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);

    assert(tokenVault.debtCeiling.toNumber() == newVaultDebtCeiling, "Vault Debt Ceiling: " + tokenVault.debtCeiling.toNumber() + " Expected Debt Ceiling: " + newVaultDebtCeiling);

    // Reverting to original vault debt ceiling
    txHash = await stablePoolProgram.rpc.setVaultDebtCeiling(
      new anchor.BN(vaultDebtCeiling),
      {
        accounts: {
          payer: superOwner.publicKey,
          globalState: globalStateKey,
          mintColl: lpMint.publicKey,
          tokenVault: tokenVaultKey,
        },
        signers: [superOwner]
      }
    ).catch(e => {
      console.log("Setting Vault Debt Ceiling Error:", e);
    });

    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);

    assert(tokenVault.debtCeiling.toNumber() == vaultDebtCeiling, "Vault Debt Ceiling: " + tokenVault.debtCeiling.toNumber() + " Expected Debt Ceiling: " + vaultDebtCeiling);
  });

  it('Set Global Debt Ceiling Fails If Not Called By Super Owner', async () => {
    const newGlobalDebtCeiling = 5_000_000;
    const [globalStateKey, globalStateNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(GLOBAL_STATE_TAG)],
      stablePoolProgram.programId,
    );

    const callSetGlobalDebtCeiling = async ()=>{
      await stablePoolProgram.rpc.setGlobalDebtCeiling(
        new anchor.BN(newGlobalDebtCeiling),
        {
          accounts: {
            payer: user.publicKey,
            globalState: globalStateKey,
          },
          signers: [user]
        });
    };

    await expect(callSetGlobalDebtCeiling(),"No error was thrown when trying to set the global debt ceiling from non super owner acount").is.rejected;

    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(globalState.debtCeiling.toNumber() == globalDebtCeiling, "Global Debt Ceiling: " + globalState.debtCeiling.toNumber() + " Expected Global Debt Ceiling: " + globalDebtCeiling);

  });

  it('Set Vault Debt Ceiling Fails If Not Called By Super Owner', async () => {
    const newVaultDebtCeiling = 5_000_000;
    const [globalStateKey, globalStateNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(GLOBAL_STATE_TAG)],
      stablePoolProgram.programId,
    );
    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const callSetVaultDebtCeiling = async ()=>{
      await stablePoolProgram.rpc.setVaultDebtCeiling(
        new anchor.BN(newVaultDebtCeiling),
        {
          accounts: {
            payer: user.publicKey,
            globalState: globalStateKey,
            mintColl: lpMint.publicKey,
            tokenVault: tokenVaultKey,
          },
          signers: [user]
        });
    };

    await expect(callSetVaultDebtCeiling(),"No error was thrown when trying to set the vault debt ceiling from non super owner acount").is.rejected;

    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);

    assert(tokenVault.debtCeiling.toNumber() == vaultDebtCeiling, "Vault Debt Ceiling: " + tokenVault.debtCeiling.toNumber() + " Expected Global Debt Ceiling: " + vaultDebtCeiling);
  });

  it('TVL Limit', async () => {
    const amount = 2_000_000_000;
    
    await lpMint.mintTo(
      userCollKey,
      superOwner,
      [],
      2_000_000_000 /* 2 LPT */
    );

    const [globalStateKey, globalStateNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_STATE_TAG)],
        stablePoolProgram.programId,
      );
    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
    console.log("fetched globalState", globalState);

    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
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
    
    const depositCollateral = async ()=>{
      await stablePoolProgram.rpc.depositCollateral(
        new anchor.BN(amount),
        {
          accounts: {
            owner: user.publicKey,
            userTrove: userTroveKey,
            tokenVault: tokenVaultKey,
            poolTokenColl: tokenCollKey,
            userTokenColl: userCollKey,
            mintColl: lpMint.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            globalState: globalStateKey,
          },
          signers: [user]
        });
    };

    console.log("Confirming deposit was rejected due to exceeding tvl");
    await expect(depositCollateral(),"No error was thrown when trying deposit an amount above the tvl").is.rejected;

    let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalColl.toNumber() == 0,
      "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(userTrove.lockedCollBalance.toNumber() == 0, 
       "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
     assert(globalState.tvl.toNumber() == 0,
       "tvl mistmatch: tvl = " + globalState.tvl);
  });

  it("User can't borrow if vault debt ceiling is exceeded", async () => {
    let userDepositAmount = 100_000_000;
    let userBorrowAmount = 9_000_000;
    let localUserDepositAmount = 100_000_000;
    let localUserBorrowAmount = 2_000_000;

    const [globalStateKey, globalStateNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(GLOBAL_STATE_TAG)],
      stablePoolProgram.programId,
    );
    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    let [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );

    let [userTroveKey, userTroveNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );

    let [tokenCollKey, tokenCollNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USER_TROVE_POOL_TAG), userTroveKey.toBuffer()],
      stablePoolProgram.programId,
    );

    let [mintUsdKey, mintUsdNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USD_MINT_TAG)],
        stablePoolProgram.programId,
      );

    let [userUsdKey, userUsdNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USD_TOKEN_TAG), user.publicKey.toBuffer(), mintUsdKey.toBuffer()],
        stablePoolProgram.programId,
      );      

    await stablePoolProgram.rpc.depositCollateral(
      new anchor.BN(userDepositAmount),
      {
        accounts: {
          owner: user.publicKey,
          userTrove: userTroveKey,
          tokenVault: tokenVaultKey,
          poolTokenColl: tokenCollKey,
          userTokenColl: userCollKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: globalStateKey,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Deposit Collateral Error:", e);
    });

    let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalColl.toNumber() == userDepositAmount,
      "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(userTrove.lockedCollBalance.toNumber() == userDepositAmount, 
        "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
    assert(globalState.tvl.toNumber() == userDepositAmount,
        "tvl mistmatch: tvl = " + globalState.tvl);

    let txHash = await stablePoolProgram.rpc.borrowUsd(
      new anchor.BN(userBorrowAmount), 
      userUsdNonce,
      {
        accounts: {
          owner: user.publicKey,
          tokenVault: tokenVaultKey,
          userTrove: userTroveKey,
          globalState: globalStateKey,
          mintUsd: mintUsdKey,
          userTokenUsd: userUsdKey,
          mintColl: lpMint.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Borrow USD Error:", e);
    });

    userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalDebt.toNumber() == userBorrowAmount, "Vault Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + userBorrowAmount);
    assert(globalState.totalDebt.toNumber() == userBorrowAmount, "Global Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + userBorrowAmount);
    assert(userTrove.debt.toNumber() == userBorrowAmount, "User Trove Debt: " + userTrove.debt + " Expected Debt: " + userBorrowAmount);
    assert(tokenVault.totalDebt.lt(tokenVault.debtCeiling), "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional");
    assert(globalState.totalDebt.lt(globalState.debtCeiling), "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional");

    // Make local user and mint tokens 
    const localUser = anchor.web3.Keypair.generate();

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(localUser.publicKey, 1000000000),
      "confirmed"
    );

    let localUserCollKey = await lpMint.createAccount(localUser.publicKey);
    await lpMint.mintTo(
      localUserCollKey,
      superOwner,
      [],
      200_000_000 /* 0.2 LPT */
    );

    const [localUserTroveKey, localUserTroveNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), localUser.publicKey.toBuffer()],
      stablePoolProgram.programId,
    );

    const [localTokenCollKey, localTokenCollNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USER_TROVE_POOL_TAG), localUserTroveKey.toBuffer()],
      stablePoolProgram.programId,
    );
    
    await stablePoolProgram.rpc.createUserTrove(
      localUserTroveNonce, 
      localTokenCollNonce, 
      {
        accounts: {
          troveOwner: localUser.publicKey,
          userTrove: localUserTroveKey,
          tokenColl: localTokenCollKey,
          tokenVault: tokenVaultKey,
          mintColl: lpMint.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [localUser]
      }
    ).catch(e => {
      console.log("Creating UserTrove Error:", e);
    });

    let localUserTrove = await stablePoolProgram.account.userTrove.fetch(localUserTroveKey);

    assert(localUserTrove.lockedCollBalance.toNumber() == 0, "lockedCollBalance mismatch");
    assert(localUserTrove.debt.toNumber() == 0, "debt mismatch");

    // Deposit and attempt to borrow, should fail

    await stablePoolProgram.rpc.depositCollateral(
      new anchor.BN(localUserDepositAmount),
      {
        accounts: {
          owner: localUser.publicKey,
          userTrove: localUserTroveKey,
          tokenVault: tokenVaultKey,
          poolTokenColl: localTokenCollKey,
          userTokenColl: localUserCollKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: globalStateKey,
        },
        signers: [localUser]
      }
    ).catch(e => {
      console.log("Deposit Collateral Error:", e);
    });

    localUserTrove = await stablePoolProgram.account.userTrove.fetch(localUserTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    console.log("localUserDepositAmount =", localUserDepositAmount);
    assert(tokenVault.totalColl.toNumber() == (userDepositAmount + localUserDepositAmount),
      "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(localUserTrove.lockedCollBalance.toNumber() == localUserDepositAmount, 
        "lockedCollBalance mismatch: lockedCollBalance = " + localUserTrove.lockedCollBalance);
    console.log("tvl = ", globalState.tvl);
    assert(globalState.tvl.toNumber() == (userDepositAmount + localUserDepositAmount),
        "tvl mistmatch: tvl = " + globalState.tvl);

    let [localUserUsdKey, localUserUsdNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USD_TOKEN_TAG), localUser.publicKey.toBuffer(), mintUsdKey.toBuffer()],
      stablePoolProgram.programId,
    );

    const borrowUsd = async ()=>{
      await stablePoolProgram.rpc.borrowUsd(
        new anchor.BN(localUserBorrowAmount), 
        localUserUsdNonce,
        {
          accounts: {
            owner: localUser.publicKey,
            tokenVault: tokenVaultKey,
            userTrove: localUserTroveKey,
            globalState: globalStateKey,
            mintUsd: mintUsdKey,
            userTokenUsd: localUserUsdKey,
            mintColl: lpMint.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
          signers: [localUser]
        });
    };

    await expect(borrowUsd(),"No error was thrown when trying borrow an amount above debt ceiling").is.rejected;

    localUserTrove = await stablePoolProgram.account.userTrove.fetch(localUserTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalDebt.toNumber() == userBorrowAmount, "Vault Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + userBorrowAmount);
    assert(globalState.totalDebt.toNumber() == userBorrowAmount, "Global Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + userBorrowAmount);
    assert(userTrove.debt.toNumber() == userBorrowAmount, "User Trove Debt: " + userTrove.debt + " Expected Debt: " + userBorrowAmount);
    assert(localUserTrove.debt.toNumber() == 0, "User Trove Debt: " + userTrove.debt + " Expected Debt: " + 0);
    assert(tokenVault.totalDebt.lt(tokenVault.debtCeiling), "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional\n tokenVault.totalDebt = " + tokenVault.totalDebt + " tokenVault.debtCeiling = " + tokenVault.debtCeiling);
    assert(globalState.totalDebt.lt(globalState.debtCeiling), "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional");

    // Clean up (repay debt, withdraw deposits)

    txHash = await stablePoolProgram.rpc.repayUsd(
      new anchor.BN(userDepositAmount), 
      {
        accounts: {
          owner: user.publicKey,
          tokenVault: tokenVaultKey,
          userTrove: userTroveKey,
          globalState: globalStateKey,
          mintUsd: mintUsdKey,
          userTokenUsd: userUsdKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Repay USD Error:", e);
    });

    userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalDebt.toNumber() == 0, "Vault Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + 0);
    assert(globalState.totalDebt.toNumber() == 0, "Global Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + 0);
    assert(userTrove.debt.toNumber() == 0, "User Trove Debt: " + userTrove.debt + " Expected Debt: " + 0);
    assert(tokenVault.totalDebt.lt(tokenVault.debtCeiling), "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional");
    assert(globalState.totalDebt.lt(globalState.debtCeiling), "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional");

    txHash = await stablePoolProgram.rpc.withdrawCollateral(
      new anchor.BN(userDepositAmount), 
      {
        accounts: {
          owner: user.publicKey,
          userTrove: userTroveKey,
          tokenVault: tokenVaultKey,
          poolTokenColl: tokenCollKey,
          userTokenColl: userCollKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: globalStateKey,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Withdraw Collateral Error:", e);
    });

    userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalColl.toNumber() == localUserDepositAmount,
       "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(userTrove.lockedCollBalance.toNumber() == 0, 
        "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
    assert(globalState.tvl.toNumber() == localUserDepositAmount,
        "tvl mistmatch: tvl = " + globalState.tvl);

    txHash = await stablePoolProgram.rpc.withdrawCollateral(
      new anchor.BN(localUserDepositAmount), 
      {
        accounts: {
          owner: localUser.publicKey,
          userTrove: localUserTroveKey,
          tokenVault: tokenVaultKey,
          poolTokenColl: localTokenCollKey,
          userTokenColl: localUserCollKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: globalStateKey,
        },
        signers: [localUser]
      }
    ).catch(e => {
      console.log("Withdraw Collateral Error:", e);
    });

    localUserTrove = await stablePoolProgram.account.userTrove.fetch(localUserTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalColl.toNumber() == 0,
        "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(localUserTrove.lockedCollBalance.toNumber() == 0, 
        "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
    assert(globalState.tvl.toNumber() == 0,
        "tvl mistmatch: tvl = " + globalState.tvl);

  });

  it("User can't borrow if global debt ceiling is exceeded", async () => {
    let userDepositAmount = 100_000_000;
    let userBorrowAmount = 4_000_000;
    let localUserDepositAmount = 100_000_000;
    let localUserBorrowAmount = 2_000_000;
    let newGlobalDebtCeiling = 5_000_000;

    const [globalStateKey, globalStateNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(GLOBAL_STATE_TAG)],
      stablePoolProgram.programId,
    );
    let globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    let txHash = await stablePoolProgram.rpc.setGlobalDebtCeiling(
      new anchor.BN(newGlobalDebtCeiling),
      {
        accounts: {
          payer: superOwner.publicKey,
          globalState: globalStateKey,
        },
        signers: [superOwner]
      }
    ).catch(e => {
      console.log("Setting Global Debt Ceiling Error:", e);
    });

    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(globalState.debtCeiling.toNumber() == newGlobalDebtCeiling, "Global Debt Ceiling: " + globalState.debtCeiling.toNumber() + " Expected Debt Ceiling: " + newGlobalDebtCeiling);

    let [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );

    let [userTroveKey, userTroveNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
      stablePoolProgram.programId,
    );

    let [tokenCollKey, tokenCollNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_POOL_TAG), userTroveKey.toBuffer()],
        stablePoolProgram.programId,
      );

    let [mintUsdKey, mintUsdNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USD_MINT_TAG)],
        stablePoolProgram.programId,
      );

    let [userUsdKey, userUsdNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USD_TOKEN_TAG), user.publicKey.toBuffer(), mintUsdKey.toBuffer()],
        stablePoolProgram.programId,
      );      

    await stablePoolProgram.rpc.depositCollateral(
      new anchor.BN(userDepositAmount),
      {
        accounts: {
          owner: user.publicKey,
          userTrove: userTroveKey,
          tokenVault: tokenVaultKey,
          poolTokenColl: tokenCollKey,
          userTokenColl: userCollKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: globalStateKey,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Deposit Collateral Error:", e);
    });

    let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalColl.toNumber() == userDepositAmount,
      "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(userTrove.lockedCollBalance.toNumber() == userDepositAmount, 
        "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
    assert(globalState.tvl.toNumber() == userDepositAmount,
        "tvl mistmatch: tvl = " + globalState.tvl);

    txHash = await stablePoolProgram.rpc.borrowUsd(
      new anchor.BN(userBorrowAmount), 
      userUsdNonce,
      {
        accounts: {
          owner: user.publicKey,
          tokenVault: tokenVaultKey,
          userTrove: userTroveKey,
          globalState: globalStateKey,
          mintUsd: mintUsdKey,
          userTokenUsd: userUsdKey,
          mintColl: lpMint.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Borrow USD Error:", e);
    });

    userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalDebt.toNumber() == userBorrowAmount, "Vault Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + userBorrowAmount);
    assert(globalState.totalDebt.toNumber() == userBorrowAmount, "Global Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + userBorrowAmount);
    assert(userTrove.debt.toNumber() == userBorrowAmount, "User Trove Debt: " + userTrove.debt + " Expected Debt: " + userBorrowAmount);
    assert(tokenVault.totalDebt.lt(tokenVault.debtCeiling), "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional");
    assert(globalState.totalDebt.lt(globalState.debtCeiling), "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional");

    // Make local user and mint tokens 
    const localUser = anchor.web3.Keypair.generate();

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(localUser.publicKey, 1000000000),
      "confirmed"
    );

    let localUserCollKey = await lpMint.createAccount(localUser.publicKey);
    await lpMint.mintTo(
      localUserCollKey,
      superOwner,
      [],
      200_000_000 /* 0.2 LPT */
    );

    const [localUserTroveKey, localUserTroveNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), localUser.publicKey.toBuffer()],
      stablePoolProgram.programId,
    );

    const [localTokenCollKey, localTokenCollNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USER_TROVE_POOL_TAG), localUserTroveKey.toBuffer()],
      stablePoolProgram.programId,
    );

    await stablePoolProgram.rpc.createUserTrove(
      localUserTroveNonce, 
      localTokenCollNonce, 
      {
        accounts: {
          troveOwner: localUser.publicKey,
          userTrove: localUserTroveKey,
          tokenColl: localTokenCollKey,
          tokenVault: tokenVaultKey,
          mintColl: lpMint.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [localUser]
      }
    ).catch(e => {
      console.log("Creating UserTrove Error:", e);
    });

    let localUserTrove = await stablePoolProgram.account.userTrove.fetch(localUserTroveKey);

    assert(localUserTrove.lockedCollBalance.toNumber() == 0, "lockedCollBalance mismatch");
    assert(localUserTrove.debt.toNumber() == 0, "debt mismatch");

    // Deposit and attempt to borrow, should fail

    await stablePoolProgram.rpc.depositCollateral(
      new anchor.BN(localUserDepositAmount),
      {
        accounts: {
          owner: localUser.publicKey,
          userTrove: localUserTroveKey,
          tokenVault: tokenVaultKey,
          poolTokenColl: localTokenCollKey,
          userTokenColl: localUserCollKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: globalStateKey,
        },
        signers: [localUser]
      }
    ).catch(e => {
      console.log("Deposit Collateral Error:", e);
    });

    localUserTrove = await stablePoolProgram.account.userTrove.fetch(localUserTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    console.log("localUserDepositAmount =", localUserDepositAmount);
    assert(tokenVault.totalColl.toNumber() == (userDepositAmount + localUserDepositAmount),
      "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(localUserTrove.lockedCollBalance.toNumber() == localUserDepositAmount, 
        "lockedCollBalance mismatch: lockedCollBalance = " + localUserTrove.lockedCollBalance);
    console.log("tvl = ", globalState.tvl);
    assert(globalState.tvl.toNumber() == (userDepositAmount + localUserDepositAmount),
        "tvl mistmatch: tvl = " + globalState.tvl);

    let [localUserUsdKey, localUserUsdNonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USD_TOKEN_TAG), localUser.publicKey.toBuffer(), mintUsdKey.toBuffer()],
      stablePoolProgram.programId,
    );

    const borrowUsd = async ()=>{
      await stablePoolProgram.rpc.borrowUsd(
        new anchor.BN(localUserBorrowAmount), 
        localUserUsdNonce,
        {
          accounts: {
            owner: localUser.publicKey,
            tokenVault: tokenVaultKey,
            userTrove: localUserTroveKey,
            globalState: globalStateKey,
            mintUsd: mintUsdKey,
            userTokenUsd: localUserUsdKey,
            mintColl: lpMint.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
          signers: [localUser]
        });
    };

    await expect(borrowUsd(),"No error was thrown when trying borrow an amount above global debt ceiling").is.rejected;

    localUserTrove = await stablePoolProgram.account.userTrove.fetch(localUserTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalDebt.toNumber() == userBorrowAmount, "Vault Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + userBorrowAmount);
    assert(globalState.totalDebt.toNumber() == userBorrowAmount, "Global Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + userBorrowAmount);
    assert(userTrove.debt.toNumber() == userBorrowAmount, "User Trove Debt: " + userTrove.debt + " Expected Debt: " + userBorrowAmount);
    assert(localUserTrove.debt.toNumber() == 0, "User Trove Debt: " + userTrove.debt + " Expected Debt: " + 0);
    assert(tokenVault.totalDebt.lt(tokenVault.debtCeiling), "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional\n tokenVault.totalDebt = " + tokenVault.totalDebt + " tokenVault.debtCeiling = " + tokenVault.debtCeiling);
    assert(globalState.totalDebt.lt(globalState.debtCeiling), "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional");

    // Clean up (repay debt, withdraw deposits)

    txHash = await stablePoolProgram.rpc.repayUsd(
      new anchor.BN(userDepositAmount), 
      {
        accounts: {
          owner: user.publicKey,
          tokenVault: tokenVaultKey,
          userTrove: userTroveKey,
          globalState: globalStateKey,
          mintUsd: mintUsdKey,
          userTokenUsd: userUsdKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Repay USD Error:", e);
    });

    userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalDebt.toNumber() == 0, "Vault Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + 0);
    assert(globalState.totalDebt.toNumber() == 0, "Global Total Debt: " + tokenVault.totalDebt + " Expected Debt: " + 0);
    assert(userTrove.debt.toNumber() == 0, "User Trove Debt: " + userTrove.debt + " Expected Debt: " + 0);
    assert(tokenVault.totalDebt.lt(tokenVault.debtCeiling), "Vault Total Debt should be less than Vault Debt Ceiling. Vault Debt ceiling not functional");
    assert(globalState.totalDebt.lt(globalState.debtCeiling), "Global Total Debt should be less than Global Debt Ceiling. Global Debt ceiling not functional");

    txHash = await stablePoolProgram.rpc.withdrawCollateral(
      new anchor.BN(userDepositAmount), 
      {
        accounts: {
          owner: user.publicKey,
          userTrove: userTroveKey,
          tokenVault: tokenVaultKey,
          poolTokenColl: tokenCollKey,
          userTokenColl: userCollKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: globalStateKey,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Withdraw Collateral Error:", e);
    });

    userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalColl.toNumber() == localUserDepositAmount,
       "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(userTrove.lockedCollBalance.toNumber() == 0, 
        "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
    assert(globalState.tvl.toNumber() == localUserDepositAmount,
        "tvl mistmatch: tvl = " + globalState.tvl);

    txHash = await stablePoolProgram.rpc.withdrawCollateral(
      new anchor.BN(localUserDepositAmount), 
      {
        accounts: {
          owner: localUser.publicKey,
          userTrove: localUserTroveKey,
          tokenVault: tokenVaultKey,
          poolTokenColl: localTokenCollKey,
          userTokenColl: localUserCollKey,
          mintColl: lpMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          globalState: globalStateKey,
        },
        signers: [localUser]
      }
    ).catch(e => {
      console.log("Withdraw Collateral Error:", e);
    });

    localUserTrove = await stablePoolProgram.account.userTrove.fetch(localUserTroveKey);
    tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
    globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);

    assert(tokenVault.totalColl.toNumber() == 0,
        "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(localUserTrove.lockedCollBalance.toNumber() == 0, 
        "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
    assert(globalState.tvl.toNumber() == 0,
        "tvl mistmatch: tvl = " + globalState.tvl);

  });
});