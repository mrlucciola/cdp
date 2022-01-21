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

describe('ratio', () => {

  // Constants
  const GLOBAL_STATE_TAG = "global-state-seed";
  const TOKEN_VAULT_TAG = "token-vault-seed";
  const USER_TROVE_TAG = "user-trove-seed";
  const USD_MINT_TAG = "usd-mint";
  const USD_TOKEN_TAG = "usd-token";
  const TOKEN_VAULT_POOL_TAG = "token-vault-pool";

  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const stablePoolProgram = anchor.workspace.StablePool as anchor.Program<StablePool>;
  const superOwner = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();

  let userCollKey = null;
  let userUsdxTokenAccount = null;

  let lpMint = null;
  const depositAmount = 100_000_000; // 0.1 LPT
  const tvlLimit = 1_000_000_000;
  const USD_DECIMAL = 6;

  console.log("superOwner =", superOwner.publicKey.toBase58());
  console.log("user =", user.publicKey.toBase58());

  it('Is initialized!', async () => {
    // Request Airdrop for superOwner & user
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(superOwner.publicKey, 1000000000),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user.publicKey, 1000000000),
      "confirmed"
    );

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

    let data = await provider.connection.getAccountInfo(stablePoolProgram.programId);
    console.log("data =", data);

    let txHash = await stablePoolProgram.rpc.createGlobalState(
      globalStateNonce, 
      mintUsdNonce,
      new anchor.BN(tvlLimit),
      {
        accounts: {
          superOwner: superOwner.publicKey,
          mintUsd: mintUsdKey,
          globalState: globalStateKey,
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
    assert(globalState.tvlLimit == tvlLimit, "GlobalState TVL Limit: " + globalState.tvlLimit + " TVL Limit: " + tvlLimit);
    assert(globalState.tvl == 0);
  });

  it('Only the super owner can create token vaults', async () => {
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

    const [tokenCollKey, tokenCollNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_POOL_TAG), tokenVaultKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const riskLevel = 0;
    
    const createVaultCall = async ()=>{
      await stablePoolProgram.rpc.createTokenVault(
        tokenVaultNonce, 
        globalStateNonce, 
        tokenCollNonce, 
        riskLevel,
        {
          accounts: {
            payer: user.publicKey,
            tokenVault: tokenVaultKey,
            globalState: globalStateKey,
            mintColl: lpMint.publicKey,
            tokenColl: tokenCollKey,
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
    console.log("GlobalStateKey", globalStateKey.toBase58());

    const globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
    console.log("fetched globalState", globalState);

    const [tokenVaultKey, tokenVaultNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), lpMint.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );
    console.log("tokenVaultKey",tokenVaultKey.toBase58());

    const [tokenCollKey, tokenCollNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_POOL_TAG), tokenVaultKey.toBuffer()],
        stablePoolProgram.programId,
      );
      console.log("tokenCollKey",tokenCollKey.toBase58());

    const riskLevel = 0;
    let txHash = await stablePoolProgram.rpc.createTokenVault(
        tokenVaultNonce, 
        globalStateNonce, 
        tokenCollNonce, 
        riskLevel,
        {
          accounts: {
            payer: superOwner.publicKey,
            tokenVault: tokenVaultKey,
            globalState: globalStateKey,
            mintColl: lpMint.publicKey,
            tokenColl: tokenCollKey,
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
    assert(tokenVault.tokenColl.toBase58() == tokenCollKey.toBase58(), "tokenCollKey mismatch");
    assert(tokenVault.totalColl == 0, "totalColl mismatch");
    assert(tokenVault.totalDebt == 0, "totalDebt mismatch");
    assert(tokenVault.riskLevel == riskLevel, "riskLevel mismatch");

  });

  it('Create Token Vault fails if globalState is not created', async () => {

    const localUser = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(localUser.publicKey, 1000000000),
      "confirmed"
    );
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

    const [tokenCollKey, tokenCollNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_POOL_TAG), tokenVaultKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const riskLevel = 0;
    
    const createVaultCall = async ()=>{
      console.log("Calling createVault");
      await stablePoolProgram.rpc.createTokenVault(
        tokenVaultNonce, 
        globalStateNonce, 
        tokenCollNonce, 
        riskLevel,
        {
          accounts: {
            payer: localUser.publicKey,
            tokenVault: tokenVaultKey,
            globalState: globalStateKey,
            mintColl: localLpMint.publicKey,
            tokenColl: tokenCollKey,
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

    await stablePoolProgram.rpc.createUserTrove(
      userTroveNonce, 
      tokenVaultNonce, 
      {
        accounts: {
          troveOwner: user.publicKey,
          userTrove: userTroveKey,
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

    assert(userTrove.lockedCollBalance == 0, "lockedCollBalance mismatch");
    assert(userTrove.debt == 0, "debt mismatch");
  });

  it('Deposit Collateral', async () => {

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

    const [tokenCollKey, tokenCollNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_POOL_TAG), tokenVaultKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const [userTroveKey, userTroveNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );
    
    const transaction = new Transaction()
    let instructions:TransactionInstruction[] = [];
    const signers:Keypair[] = [];

    await stablePoolProgram.rpc.depositCollateral(
      new anchor.BN(depositAmount),
      tokenVaultNonce,
      userTroveNonce,
      tokenCollNonce,
      globalStateNonce,
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

    console.log("depositAmount =", depositAmount);
    assert(tokenVault.totalColl == depositAmount,
       "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(userTrove.lockedCollBalance == depositAmount, 
        "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
    console.log("tvl = ", globalState.tvl);
    assert(globalState.tvl == depositAmount,
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
      tokenVaultNonce,
      userTroveNonce,
      globalStateNonce,
      mintUsdNonce,
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

    console.log("userTrove.debt =", userTrove.debt.toString());
    console.log("userTrove.lastMintTime =", userTrove.lastMintTime);
    console.log("tokenVault.total_debt =", tokenVault.totalDebt.toString());

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
      tokenVaultNonce,
      userTroveNonce,
      globalStateNonce,
      mintUsdNonce,
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
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Repay USD Error:", e);
    });
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

    const [tokenCollKey, tokenCollNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_POOL_TAG), tokenVaultKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const [userTroveKey, userTroveNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const txHash = await stablePoolProgram.rpc.withdrawCollateral(
      new anchor.BN(depositAmount), 
      tokenVaultNonce,
      userTroveNonce,
      tokenCollNonce,
      globalStateNonce,
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

    assert(tokenVault.totalColl == 0,
       "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(userTrove.lockedCollBalance == 0, 
        "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
    assert(globalState.tvl == 0,
        "tvl mistmatch: tvl = " + globalState.tvl);

    let poolLpTokenAccount = await lpMint.getAccountInfo(tokenCollKey);
    let userLpTokenAccount = await lpMint.getAccountInfo(userCollKey);

    console.log("poolLpTokenAccount.amount =", poolLpTokenAccount.amount.toString());
    console.log("userLpTokenAccount.amount =", userLpTokenAccount.amount.toString());
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

    const [tokenCollKey, tokenCollNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_POOL_TAG), tokenVaultKey.toBuffer()],
        stablePoolProgram.programId,
      );

    const [userTroveKey, userTroveNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
        stablePoolProgram.programId,
      );
    
    const transaction = new Transaction()
    let instructions:TransactionInstruction[] = [];
    const signers:Keypair[] = [];

    const depositCollateral = async ()=>{
      await stablePoolProgram.rpc.depositCollateral(
        new anchor.BN(amount),
        tokenVaultNonce,
        userTroveNonce,
        tokenCollNonce,
        globalStateNonce,
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

    assert(tokenVault.totalColl == 0,
      "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    assert(userTrove.lockedCollBalance == 0, 
       "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
     assert(globalState.tvl == 0,
       "tvl mistmatch: tvl = " + globalState.tvl);
  });
});
