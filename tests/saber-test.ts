import * as anchor from '@project-serum/anchor';
const serumCmn = require("@project-serum/common");

import { StablePool } from '../target/types/stable_pool';
import {
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Token, AccountLayout } from "@solana/spl-token";
import {use as chaiUse, assert} from 'chai'    
import chaiAsPromised from 'chai-as-promised'

import { deployNewSwap, ISeedPoolAccountsFn, Fees, DEFAULT_FEE} from '@saberhq/stableswap-sdk';
import { SignerWallet, SolanaProvider } from "@saberhq/solana-contrib";
import {
  createInitMintInstructions,
  SPLToken,
  TOKEN_PROGRAM_ID,
  Percent,
  u64,
  TokenAmount,
  getOrCreateATA,
  getOrCreateATAs,
  Token as SToken,
  createMint,
  createMintToInstruction,
  getTokenAccount,
  ZERO,
  sleep,
} from "@saberhq/token-utils";

import { deployTestTokens } from './saber-utils/deployTestTokens';
import { findMinerAddress, QuarrySDK, QUARRY_ADDRESSES } from '@quarryprotocol/quarry-sdk';
import { isMainThread } from 'worker_threads';
import { BN } from '@project-serum/anchor';
chaiUse(chaiAsPromised)

const usePrevConfigs = true;

export declare type PlatformType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export declare const TYPE_ID_RAYDIUM: PlatformType;
export declare const TYPE_ID_ORCA: PlatformType;
export declare const TYPE_ID_SABER: PlatformType;
export declare const TYPE_ID_MERCURIAL: PlatformType;
export declare const TYPE_ID_UNKNOWN: PlatformType;

const defaultAccounts = {
  tokenProgram: TOKEN_PROGRAM_ID,
  clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  systemProgram: SystemProgram.programId,
  rent: anchor.web3.SYSVAR_RENT_PUBKEY,
}


const INITIAL_TOKEN_A_AMOUNT = LAMPORTS_PER_SOL;
const INITIAL_TOKEN_B_AMOUNT = LAMPORTS_PER_SOL;
const AMP_FACTOR = 100;
const INITIAL_BASE_AMOUNT = 5000000000000000

const depositAmount = 100_000_000; // 0.1 LPT
const DEFAULT_DECIMALS = 6;
const DEFAULT_HARD_CAP = 1_000_000_000_000;

const FEES: Fees = {
  adminTrade: DEFAULT_FEE,
  adminWithdraw: DEFAULT_FEE,
  trade: new Percent(1, 4),
  withdraw: DEFAULT_FEE,
};

// Constants
const GLOBAL_STATE_TAG = "global-state-seed";
const TOKEN_VAULT_TAG = "token-vault-seed";
const USER_TROVE_TAG = "user-trove";
const USD_MINT_TAG = "usd-mint";
const USER_TROVE_POOL_TAG = "user-trove-pool";

const SABER_SWAP_PROGRAM = new anchor.web3.PublicKey("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
const SABER_FARM_PROGRAM = new anchor.web3.PublicKey("QMNeHCGYnLVDn1icRAfQZpjPLBNkfGbSKRB83G5d8KB");
const FEE_OWNER = new anchor.web3.PublicKey('2Pv5mjmKYAtXNpr3mcsXf7HjtS3fieJeFoWPATVT5rWa');

let globalStateKey, globalStateNonce;
let mintUsdKey, mintUsdNonce;
let tokenVaultKey, tokenVaultNonce;

let userTroveKey, userTroveNonce;
let userTroveTokenVaultKey, userTroveTokenVaultNonce;
let userTroveRewardKey, userTroveRewardNonce;
let userMinerKey, userMinerBump;
let userMinerVaultKey, userMinerVaultBump;

let userLPTokenKey, userRewardKey;
let feeCollectorKey;

const anchorProvider = anchor.Provider.env();
let connection = anchorProvider.connection;
anchor.setProvider(anchorProvider);

const user = loadKeypair();
const user_provider = new anchor.Provider(connection, new anchor.Wallet(user), {
  skipPreflight: true,
  commitment: "confirmed",
  preflightCommitment: "confirmed"
});


const superAuthority = loadKeypair();
const super_provider = new anchor.Provider(connection, new anchor.Wallet(superAuthority), {
  skipPreflight: true,
  commitment: "confirmed",
  preflightCommitment: "confirmed"
});

console.log("superAuthority =", superAuthority.publicKey.toBase58());
console.log("user =", user.publicKey.toBase58());

describe('saber-test', () => {



  // Configure the client to use the local cluster.
  const provider = new SignerWallet(superAuthority).createProvider(connection);

  const stablePoolProgram = anchor.workspace.StablePool as anchor.Program<StablePool>;

  let saberMintToken = null;
  let saberSwapMintKey;
  // Initial amount in each swap token
  let mine;
  let mintWrapper;
  let rewardsMint;
  let rewardsMintKP;
  let mintWrapperKey;
  let rewardsMintToken;
  let rewardsTokenMintKey;
  let rewarderClaimFeeTokenAccount;
  let minterId;
  let minter;
  let saberFarmQuarry;
  let saberFarmMiner;
  let saberFarmMinerVault;
  let saberFarmRewarder;
  
  it('Is initialized!', async () => {

    if(usePrevConfigs){
      saberSwapMintKey = new anchor.web3.PublicKey('2y3JStod54SRoPC6a9LvAb7iRz4cjbF1N4eNeXsHCKhS');

      saberFarmQuarry = new anchor.web3.PublicKey('BTimzTk51pcKxDQLRR3iFs4dLVY9WyKgRBmnd1rZLN6n');
      saberFarmRewarder = new anchor.web3.PublicKey("CfmVBs4jbNQNtNMn5iHkA4upHBUVuTqAkpGqRV3k4hRh");
      
      mintWrapperKey = new anchor.web3.PublicKey("Da6B5yuX2nSnmMq6rhxW2mVCpXkCiU9GrqbRenzR4jtX");
      minter = new anchor.web3.PublicKey("FZwq3nguZdiKjDEjkNR8cdLah9xt5Fp1xkHb6Cj6HPNY");
      
      rewardsTokenMintKey = new anchor.web3.PublicKey("5thfi9cDKV9BLvgVPd6f5F984tAsGAk4yJzTng8wn891");
      rewarderClaimFeeTokenAccount = new anchor.web3.PublicKey("6SKxs5sGrhwoXiTFD7XK3ZCjFZmLoKD15kP8nA5yfxHL");

      userLPTokenKey = new anchor.web3.PublicKey("AnHaGqBMuoFyNBuG2cL7GTJmz7Qo85kekYTbKUrrhtex");
      
      userRewardKey = new anchor.web3.PublicKey("dkmEbZpsdoq1MFCYeuXGc2QHL4XX4n1sm3emrWxMy4h");
      feeCollectorKey = new anchor.web3.PublicKey("6jBjKPTWdfdHBf414V5pgKQuQDBmsxg3QGDxHmRsHHGP");
      saberFarmMiner = new anchor.web3.PublicKey("6zDtZFuqcDSjcKXvfSdfQF7t7s9FrpTwM8a1pUGJmL2M");
      saberFarmMinerVault = new anchor.web3.PublicKey("CvTbpv5YmSjBgDYah3NGzsBhvn2m8Dmys7aUX6Dkr3X1");
      saberMintToken = new SPLToken(
        provider.connection,
        saberSwapMintKey,
        TOKEN_PROGRAM_ID,
        user
      );
      rewardsMintToken = new SPLToken(
        provider.connection,
        rewardsTokenMintKey,
        TOKEN_PROGRAM_ID,
        user
      );
    }
    else
    {
      const {mintA, mintB, seedPoolAccounts,} = await deployTestTokens({
        provider,
        minterSigner: user,
        initialTokenAAmount: INITIAL_TOKEN_A_AMOUNT,
        initialTokenBAmount: INITIAL_TOKEN_B_AMOUNT,
      });
      const stableSwapAccount = Keypair.generate();
      
      const { swap: newSwap, initializeArgs } = await deployNewSwap({
        provider,
        swapProgramID: SABER_SWAP_PROGRAM,
        adminAccount: user.publicKey,
        tokenAMint: mintA, // wrapped SOL
        tokenBMint: mintB, // mSOL
        ampFactor: new u64(AMP_FACTOR),
        fees: FEES,

        initialLiquidityProvider: user.publicKey,
        useAssociatedAccountForInitialLP: true,
        seedPoolAccounts,

        swapAccountSigner: stableSwapAccount,
      });

      saberSwapMintKey = initializeArgs.poolTokenMint;
      const poolMintToken = SToken.fromMint(saberSwapMintKey, DEFAULT_DECIMALS);
      
      const mintAToken = new SPLToken(
        provider.connection,
        initializeArgs.tokenA.mint,
        TOKEN_PROGRAM_ID,
        user
      );

      const mintBToken = new SPLToken(
        provider.connection,
        initializeArgs.tokenB.mint,
        TOKEN_PROGRAM_ID,
        user
      );
      
      const aToken = await mintAToken.createAccount(user.publicKey);
      const bToken = await mintBToken.createAccount(user.publicKey);
      await mintAToken.mintTo(aToken, user, [], INITIAL_BASE_AMOUNT);
      await mintBToken.mintTo(bToken, user, [], INITIAL_BASE_AMOUNT);
      
      let sdk: QuarrySDK = QuarrySDK.load({
        provider,
      });
      
      mintWrapper = sdk.mintWrapper;
      mine = sdk.mine;

      rewardsMintKP = Keypair.generate();
      rewardsMint = rewardsMintKP.publicKey;

      let baseToken = SToken.fromMint(rewardsMint, DEFAULT_DECIMALS);
      // let baseToken = SToken.fromMint(initializeArgs.tokenA.mint, DEFAULT_DECIMALS);
      let baseHardCap = TokenAmount.parse(baseToken, DEFAULT_HARD_CAP.toString());
      const { tx, mintWrapper: wrapperKey } = await mintWrapper.newWrapper({
        hardcap: baseHardCap.toU64(),
        // tokenMint: initializeArgs.tokenA.mint, // base Mint
        tokenMint: rewardsMint,
      });

      let txInitMint = await createInitMintInstructions({
        provider,
        mintKP: rewardsMintKP, // Account with signing authority on the original token (baseToken)
        decimals: DEFAULT_DECIMALS,
        mintAuthority: wrapperKey,
        freezeAuthority: wrapperKey,
      })
      await txInitMint.confirm();
      await tx.confirm();
      mintWrapperKey = wrapperKey;
      rewardsMintToken = new SPLToken(
        provider.connection,
        rewardsMint,
        TOKEN_PROGRAM_ID,
        user
      );

      const { tx: txRewarder, key: rewarderKey } = await mine.createRewarder({
        mintWrapper: mintWrapperKey,
        authority: provider.wallet.publicKey,
      });

      // await expectTX(tx, "Create new rewarder").to.be.fulfilled;
      await txRewarder.confirm();

      // let rewarderKey = rewarder;
      let rewarder = await mine.loadRewarderWrapper(rewarderKey);
      saberFarmRewarder = rewarderKey;

      rewarderClaimFeeTokenAccount = rewarder.rewarderData.claimFeeTokenAccount;
      const allowance = new u64(1_000_000);
      // minterId = Keypair.generate().publicKey;

      // Minter authority is the rewarder itself since the latter distributes quarry rewards
      minterId = rewarderKey;
      let txMinter = await mintWrapper.newMinterWithAllowance(mintWrapperKey, minterId, allowance);
      await txMinter.confirm();
      [minter] = await anchor.web3.PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode("MintWrapperMinter"), mintWrapperKey.toBuffer(), minterId.toBuffer()],
        QUARRY_ADDRESSES.MintWrapper
      );
      const { quarry: quarryKey, tx: txQuarry } = await rewarder.createQuarry({
        // token: baseToken,
        token: poolMintToken,
      });
      await txQuarry.confirm();
      
      let quarry = await rewarder.getQuarry(poolMintToken);

      let txMiner = (await quarry.createMiner()).tx
      await txMiner.confirm();
      
      const minerKey = await quarry.getMinerAddress(user.publicKey);
      let miner = await quarry.getMiner(user.publicKey);
      const minerVaultKey = miner?.tokenVaultKey;
      saberFarmMiner = minerKey;
      saberFarmMinerVault = minerVaultKey!;

      saberFarmQuarry = quarryKey;

      saberMintToken = new SPLToken(
        provider.connection,
        saberSwapMintKey,
        TOKEN_PROGRAM_ID,
        user
      );

      userLPTokenKey = await saberMintToken.createAccount(user.publicKey);

      const depositTx = new Transaction().add(
        newSwap.deposit(
          {
          userAuthority: user.publicKey,
          sourceA: aToken,
          sourceB: bToken,
          poolTokenAccount: userLPTokenKey,
          tokenAmountA: new u64(INITIAL_BASE_AMOUNT / 2),
          tokenAmountB: new u64(INITIAL_BASE_AMOUNT / 2),
          minimumPoolTokenAmount: new u64(0)
        })
      )
      await user_provider.send(depositTx, [], {})
      const lpTokenAmount = await getTokenAmount(userLPTokenKey);
      console.log("Deposited ", lpTokenAmount.toString());

      userRewardKey = await rewardsMintToken.createAccount(user.publicKey);
      feeCollectorKey = await rewardsMintToken.createAccount(FEE_OWNER);

      console.log("saberSwapMintKey", saberSwapMintKey.toString());
      console.log("saberFarmQuarry", saberFarmQuarry.toString());
      console.log("saberFarmMiner", saberFarmMiner.toString());
      console.log("saberFarmMinerVault", saberFarmMinerVault.toString());
      console.log("saberFarmRewarder", saberFarmRewarder.toString());
      console.log("mintWrapperKey", mintWrapperKey.toString());
      console.log("minter", minter.toString());
      console.log("rewardsTokenMint", rewardsTokenMintKey.toString());
      console.log("claimFeeTokenAccount", rewarderClaimFeeTokenAccount.toString());
      console.log("userLPTokenKey", userLPTokenKey);
    }
  });
  it('Create PDA', async() =>{
    console.log("Program ID", stablePoolProgram.programId.toBase58());

    [globalStateKey, globalStateNonce] =  await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(GLOBAL_STATE_TAG)],
      stablePoolProgram.programId,
    );
    console.log("globalStateKey =", globalStateKey.toBase58());

    [mintUsdKey, mintUsdNonce] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USD_MINT_TAG)],
        stablePoolProgram.programId,
      );
    console.log("mintUsdKey =", mintUsdKey.toBase58());

    [tokenVaultKey, tokenVaultNonce] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(TOKEN_VAULT_TAG), saberSwapMintKey.toBuffer()],
        stablePoolProgram.programId,
      );
    console.log("tokenVaultKey =", tokenVaultKey.toBase58());

    [userTroveKey, userTroveNonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USER_TROVE_TAG), tokenVaultKey.toBuffer(), user.publicKey.toBuffer()],
      stablePoolProgram.programId,
    );
    console.log("userTroveKey =", userTroveKey.toBase58());
  });

  it('Create Global State', async () => {
    
    try {
      const globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
      console.log("Global state is already created", globalState);
    }catch{
      console.log("Creating global state", );

      let txHash = await stablePoolProgram.rpc.createGlobalState(
        globalStateNonce, 
        mintUsdNonce, 
        new BN(100_000_000_000_000),
        new BN(100_000_000_000_000),
        {
          accounts: {
            globalState: globalStateKey,
            superOwner: superAuthority.publicKey,
            mintUsd: mintUsdKey,
            ...defaultAccounts
          },
          signers: [superAuthority]
        }
      ).catch(e => {
        console.log("e =", e);
      });
      console.log("txHash =", txHash);
  
      const globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
  
      assert(globalState.authority.toBase58() == superAuthority.publicKey.toBase58());
      assert(globalState.mintUsd.toBase58() == mintUsdKey.toBase58());
  
    }

  });

  it('Create Token Vault', async () => {

    const globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
    try{
      const tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
      console.log("Token Vault already exists", tokenVault);
    }
    catch{
      const riskLevel = 4;
      const isDual = 0;
      console.log("Creating Token Vault", tokenVaultNonce);
    
      let txHash = await stablePoolProgram.rpc.createTokenVault(
          tokenVaultNonce, 
          riskLevel,
          isDual,
          new BN(100_000_000_000_000),
          TYPE_ID_SABER,
          {
            accounts: {
              authority: superAuthority.publicKey,
              tokenVault: tokenVaultKey,
              globalState: globalStateKey,
              mintColl: saberSwapMintKey,
              ...defaultAccounts,
            },
            signers: [superAuthority]
          }
      ).catch(e => {
        console.log("Creating Vault Error:", e);
      });
    
      let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);
  
      assert(tokenVault.riskLevel == riskLevel, "riskLevel mismatch");
  
    }

  });

  it('Create User Trove', async () => {
    [userTroveTokenVaultKey, userTroveTokenVaultNonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USER_TROVE_POOL_TAG), userTroveKey.toBuffer(), saberSwapMintKey.toBuffer()],
      stablePoolProgram.programId,
    );

    try {
      let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
      console.log("User Trove already created:", userTrove);
    }      
    catch{

      const tx1 = await stablePoolProgram.transaction.createUserTrove(
        userTroveNonce, 
        userTroveTokenVaultNonce, 
        new anchor.BN(0),
        {
          accounts: {
            tokenVault: tokenVaultKey,
            userTrove: userTroveKey,

            authority: user.publicKey,
  
            tokenColl: userTroveTokenVaultKey,
            mintColl: saberSwapMintKey,
  
            ...defaultAccounts,
          },
        }
      );
      await user_provider.send(tx1, [], {})
  
      let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
  
      assert(userTrove.lockedCollBalance.toString() == "0", "lockedCollBalance mismatch");
      assert(userTrove.debt.toString() == "0", "debt mismatch");
    }
  });

  it('Create User Reward Vault', async () => {
    [userTroveRewardKey, userTroveRewardNonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from(USER_TROVE_POOL_TAG), userTroveKey.toBuffer(), rewardsTokenMintKey.toBuffer()],
      stablePoolProgram.programId,
    );
     try{
      let reward = await rewardsMintToken.getAccountInfo(userTroveRewardKey);
      console.log("User Trove Reward token already created");
     }
     catch{
      const tx1 = await stablePoolProgram.transaction.createUserRewardVault(
        userTroveRewardNonce,
        {
          accounts: {
            authority: user.publicKey,
            userTrove: userTroveKey,
            tokenVault: tokenVaultKey,
  
            rewardVault: userTroveRewardKey,
            rewardMint: rewardsTokenMintKey,
  
            ...defaultAccounts,
          },
        }
      );
      await user_provider.send(tx1, [], {})
    
      let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
  
      assert(userTrove.lockedCollBalance.toString() == "0", "lockedCollBalance mismatch");
      assert(userTrove.debt.toString() == "0", "debt mismatch");
     }

  });

  it('Create Quarry Miner', async () => {
    [userMinerKey, userMinerBump] = await findMinerAddress(saberFarmQuarry, userTroveKey);

    [userMinerVaultKey, userMinerVaultBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("Miner-Vault"), userMinerKey.toBuffer(), saberSwapMintKey.toBuffer()],
      stablePoolProgram.programId,
    );
    try{
      let sdk: QuarrySDK = QuarrySDK.load({provider});
      let rewarder = await sdk.mine.loadRewarderWrapper(saberFarmRewarder);
      console.log("Minter add");
      const whitelist_tx = mintWrapper.newMinterWithAllowance(
          mintWrapperKey,
          rewarder,
          new u64(100_000_000_000000)
        )
      console.log("Setting Annual Rate");

      const tx = rewarder.setAnnualRewards({
        newAnnualRate: new u64(1000),
      });
      await tx.confirm();

      
      const poolMintToken = SToken.fromMint(saberSwapMintKey, DEFAULT_DECIMALS);
      console.log("Quarry Token", poolMintToken, poolMintToken.mintAccount);
      let quarry = await rewarder.getQuarry(poolMintToken);
      
      console.log("Quarry", quarry);
      
      const minerKey = await quarry.getMinerAddress(userTroveKey);
      let miner = await quarry.getMiner(userTroveKey);
      console.log("Miner", miner)
      assert(miner != null, "Miner created already");
      const minerVaultKey = miner?.tokenVaultKey;
      
      saberFarmMiner = minerKey;
      saberFarmMinerVault = minerVaultKey!;
    }catch(e){
      console.log(e);
      console.log("Creating Miner account");
      console.log({            tokenVault: tokenVaultKey.toString(),
        userTrove: userTroveKey.toString(),
        payer: user.publicKey.toString(),
        miner: userMinerKey.toString(),
        quarry: saberFarmQuarry.toString(),
        rewarder: saberFarmRewarder.toString(),
        minerVault: userMinerVaultKey.toString(),
        tokenMint: saberSwapMintKey.toString(),
        quarryProgram: QUARRY_ADDRESSES.Mine.toString(),
      })
      const tx1 = await stablePoolProgram.transaction.createQuarryMiner(
        userMinerBump,
        userMinerVaultBump,
        {
          accounts:{
            tokenVault: tokenVaultKey,
            userTrove: userTroveKey,
            payer: user.publicKey,
            miner: userMinerKey,
            quarry: saberFarmQuarry,
            rewarder: saberFarmRewarder,
            minerVault: userMinerVaultKey,
            tokenMint: saberSwapMintKey,
            quarryProgram: QUARRY_ADDRESSES.Mine,
            ...defaultAccounts,
          }
        }
      );
      await user_provider.send(tx1, [], {})

      saberFarmMiner = userMinerKey;
      saberFarmMinerVault = userMinerVaultKey;
    }

  });
  it('Deposit to Saber', async () => {

    const globalState = await stablePoolProgram.account.globalState.fetch(globalStateKey);
  
    await stablePoolProgram.rpc.depositToSaber(
      new anchor.BN(depositAmount),
      {
        accounts: {
          ratioStaker:{
            globalState: globalStateKey,
            tokenVault: tokenVaultKey,
            userTrove: userTroveKey,
            owner: user.publicKey,
            poolTokenColl: userTroveTokenVaultKey,
            userTokenColl: userLPTokenKey,
            mintColl: saberSwapMintKey,
            tokenProgram: TOKEN_PROGRAM_ID,  
          },
          saberFarm:{
            quarry: saberFarmQuarry,
            miner: saberFarmMiner,
            minerVault: saberFarmMinerVault
          },
          saberFarmRewarder,
          saberFarmProgram: SABER_FARM_PROGRAM,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Deposit Collateral Error:", e);
    });

    let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);

    console.log("depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    console.log("lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);
    
    let poolLpTokenAccount = await saberMintToken.getAccountInfo(userTroveTokenVaultKey);
    let userLpTokenAccount = await saberMintToken.getAccountInfo(userLPTokenKey);

    console.log("poolLpTokenAccount.amount =", poolLpTokenAccount.amount.toString());
    console.log("userLpTokenAccount.amount =", userLpTokenAccount.amount.toString());
  });
  it('Harvest from Saber', async () => {
    await sleep(5000);
    await stablePoolProgram.rpc.harvestFromSaber(
      {
        accounts: {
          ratioHarvester:{
            globalState: globalStateKey,
            tokenVault: tokenVaultKey,
            userTrove: userTroveKey,

            authority: user.publicKey,

            userTroveReward: userTroveRewardKey,
            userRewardToken: userRewardKey,
            rewardFeeToken: feeCollectorKey,
            collateralMint: saberSwapMintKey,
            ...defaultAccounts,
          },
          saberFarm:{
            quarry: saberFarmQuarry,
            miner: saberFarmMiner,
            minerVault: saberFarmMinerVault
          },
          userTokenColl: userTroveTokenVaultKey,
          saberFarmRewarder,
          saberFarmProgram: SABER_FARM_PROGRAM,

          mintWrapper: mintWrapperKey,
          mintWrapperProgram: QUARRY_ADDRESSES.MintWrapper,

          minter,
          rewardsTokenMint: rewardsTokenMintKey,
          claimFeeTokenAccount: rewarderClaimFeeTokenAccount,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Harvest Reward Error:", e);
    });

    let reward = await rewardsMintToken.getAccountInfo(userRewardKey);
    let fee = await rewardsMintToken.getAccountInfo(feeCollectorKey);

    console.log("reward.amount =", reward.amount.toString());
    console.log("fee amount =", fee.amount.toString());
  });
  it('Withdraw from Saber', async () => {

    await stablePoolProgram.rpc.withdrawFromSaber(
      new BN(depositAmount),
      {
        accounts: {
          ratioStaker:{
            globalState: globalStateKey,
            tokenVault: tokenVaultKey,
            userTrove: userTroveKey,
            owner: user.publicKey,
            poolTokenColl: userTroveTokenVaultKey,
            userTokenColl: userLPTokenKey,
            mintColl: saberSwapMintKey,
            tokenProgram: TOKEN_PROGRAM_ID,  
          },
          saberFarm:{
            quarry: saberFarmQuarry,
            miner: saberFarmMiner,
            minerVault: saberFarmMinerVault
          },
          saberFarmRewarder,
          saberFarmProgram: SABER_FARM_PROGRAM,
        },
        signers: [user]
      }
    ).catch(e => {
      console.log("Withdraw Collateral Error:", e);
    });

    let userTrove = await stablePoolProgram.account.userTrove.fetch(userTroveKey);
    let tokenVault = await stablePoolProgram.account.tokenVault.fetch(tokenVaultKey);

    console.log( "depositAmount mismatch: totalColl = " + tokenVault.totalColl);
    console.log( "lockedCollBalance mismatch: lockedCollBalance = " + userTrove.lockedCollBalance);

    let poolLpTokenAccount = await saberMintToken.getAccountInfo(userTroveTokenVaultKey);
    let userLpTokenAccount = await saberMintToken.getAccountInfo(userLPTokenKey);

    console.log("poolLpTokenAccount.amount =", poolLpTokenAccount.amount.toString());
    console.log("userLpTokenAccount.amount =", userLpTokenAccount.amount.toString());
  });

});


async function getTokenAmount (account) {
  const { amount } = await serumCmn.getTokenAccount(anchorProvider, account)
  return amount
}

function loadKeypair(path = process.env.ANCHOR_WALLET){
  return anchor.web3.Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(
        require("fs").readFileSync(path, {
          encoding: "utf-8",
        })
      )
    )
  );
}