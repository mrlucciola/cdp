// anchor/solana
import * as anchor from "@project-serum/anchor";
import { Provider, Program, BN, Wallet } from "@project-serum/anchor";
// why is this being imported?
// const serumCmn = require("@project-serum/common");
import {
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, Token as SPLToken } from "@solana/spl-token";
// utils
import { use as chaiUse, assert } from "chai";
import chaiAsPromised from "chai-as-promised";
// saber - ONE OF THESE IMPORTS IS INTERFERING WITH ANCHOR'S WALLET TYPE
import { deployNewSwap, Fees, DEFAULT_FEE } from "@saberhq/stableswap-sdk";
import { SignerWallet } from "@saberhq/solana-contrib";
import {
  createInitMintInstructions,
  TokenAmount,
  Percent,
  u64,
  Token as SToken,
  sleep,
} from "@saberhq/token-utils";
// quarry
import {
  findMinerAddress,
  QuarrySDK,
  QUARRY_ADDRESSES,
} from "@quarryprotocol/quarry-sdk";
// local
import { deployTestTokens } from "./deployTestTokens";
import { StablePool } from "../../target/types/stable_pool";
import * as constants from "../utils/constants";
import { initUsersObj, Users, usersObj } from "../config/users";
import { Accounts, configAccountsObj } from "../config/accounts";

chaiUse(chaiAsPromised);

// THIS IS INCOMPLETE AND NOT WORKING

const usePrevConfigs = true;

export declare type PlatformType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
// export const TYPE_ID_RAYDIUM: PlatformType = 0; // TODO: Add in another ticket. jkap 2/13/22
// export const TYPE_ID_ORCA: PlatformType = 1; // TODO: Add in another ticket. jkap 2/13/22
export const TYPE_ID_SABER: PlatformType = 2;
// export const TYPE_ID_MERCURIAL: PlatformType = 3; // TODO: Add in another ticket. jkap 2/13/22
export const TYPE_ID_UNKNOWN: PlatformType = 4;

const defaultAccounts = {
  tokenProgram: TOKEN_PROGRAM_ID,
  clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  systemProgram: SystemProgram.programId,
  rent: anchor.web3.SYSVAR_RENT_PUBKEY,
};

const INITIAL_TOKEN_A_AMOUNT = LAMPORTS_PER_SOL;
const INITIAL_TOKEN_B_AMOUNT = LAMPORTS_PER_SOL;
const AMP_FACTOR = 100;
const INITIAL_BASE_AMOUNT = 5000000000000000;

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
const SABER_SWAP_PROGRAM = new anchor.web3.PublicKey(
  "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ"
);
const SABER_FARM_PROGRAM = new anchor.web3.PublicKey(
  "QMNeHCGYnLVDn1icRAfQZpjPLBNkfGbSKRB83G5d8KB"
);
const FEE_OWNER = new anchor.web3.PublicKey(
  "2Pv5mjmKYAtXNpr3mcsXf7HjtS3fieJeFoWPATVT5rWa"
);

let userTroveRewardKey, userTroveRewardNonce;
let userMinerKey, userMinerBump;
let userMinerVaultKey, userMinerVaultBump;

let userLPTokenKey, userRewardKey;
let feeCollectorKey;

const stablePoolProgram = anchor.workspace.StablePool as Program<StablePool>;
const anchorProvider = anchor.Provider.env();
let connection = anchorProvider.connection;
anchor.setProvider(anchorProvider);

const userProvider = new Provider(connection, usersObj.base.wallet, {
  skipPreflight: true,
  commitment: "confirmed",
  preflightCommitment: "confirmed",
});

const superProvider = new Provider(connection, usersObj.super.wallet, {
  skipPreflight: true,
  commitment: "confirmed",
  preflightCommitment: "confirmed",
});

const provider = new SignerWallet(usersObj.super.wallet).createProvider(
  connection
);
console.log("superAuthority =", usersObj.super.wallet.publicKey.toBase58());
console.log("user =", usersObj.base.wallet.publicKey.toBase58());

describe("saber-test", () => {
  // Configure the client to use the local cluster.

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
  let accounts: Accounts;
  let users: Users;

  before(async () => {
    accounts = await configAccountsObj(anchorProvider, usersObj);

    users = await initUsersObj(
      anchorProvider,
      accounts,
      usersObj,
      accounts.vaultLpSaber
    );
  });

  it("Is initialized!", async () => {
    if (usePrevConfigs) {
      saberSwapMintKey = new PublicKey(
        "2y3JStod54SRoPC6a9LvAb7iRz4cjbF1N4eNeXsHCKhS"
      );

      saberFarmQuarry = new PublicKey(
        "BTimzTk51pcKxDQLRR3iFs4dLVY9WyKgRBmnd1rZLN6n"
      );
      saberFarmRewarder = new PublicKey(
        "CfmVBs4jbNQNtNMn5iHkA4upHBUVuTqAkpGqRV3k4hRh"
      );

      mintWrapperKey = new PublicKey(
        "Da6B5yuX2nSnmMq6rhxW2mVCpXkCiU9GrqbRenzR4jtX"
      );
      minter = new PublicKey("FZwq3nguZdiKjDEjkNR8cdLah9xt5Fp1xkHb6Cj6HPNY");

      rewardsTokenMintKey = new PublicKey(
        "5thfi9cDKV9BLvgVPd6f5F984tAsGAk4yJzTng8wn891"
      );
      rewarderClaimFeeTokenAccount = new PublicKey(
        "6SKxs5sGrhwoXiTFD7XK3ZCjFZmLoKD15kP8nA5yfxHL"
      );

      userLPTokenKey = new anchor.web3.PublicKey(
        "AnHaGqBMuoFyNBuG2cL7GTJmz7Qo85kekYTbKUrrhtex"
      );

      userRewardKey = new anchor.web3.PublicKey(
        "dkmEbZpsdoq1MFCYeuXGc2QHL4XX4n1sm3emrWxMy4h"
      );
      feeCollectorKey = new anchor.web3.PublicKey(
        "6jBjKPTWdfdHBf414V5pgKQuQDBmsxg3QGDxHmRsHHGP"
      );
      saberFarmMiner = new anchor.web3.PublicKey(
        "6zDtZFuqcDSjcKXvfSdfQF7t7s9FrpTwM8a1pUGJmL2M"
      );
      saberFarmMinerVault = new anchor.web3.PublicKey(
        "CvTbpv5YmSjBgDYah3NGzsBhvn2m8Dmys7aUX6Dkr3X1"
      );
      rewardsMintToken = new SPLToken(
        provider.connection,
        rewardsTokenMintKey,
        TOKEN_PROGRAM_ID,
        users.base.wallet
      );
    } else {
      const { mintA, mintB, seedPoolAccounts } = await deployTestTokens({
        provider,
        minterSigner: users.super.wallet,
        initialTokenAAmount: INITIAL_TOKEN_A_AMOUNT,
        initialTokenBAmount: INITIAL_TOKEN_B_AMOUNT,
      });
      const stableSwapAccount = Keypair.generate();

      const { swap: newSwap, initializeArgs } = await deployNewSwap({
        provider,
        swapProgramID: SABER_SWAP_PROGRAM,
        adminAccount: users.base.wallet.publicKey,
        tokenAMint: mintA, // wrapped SOL
        tokenBMint: mintB, // mSOL
        ampFactor: new u64(AMP_FACTOR),
        fees: FEES,

        initialLiquidityProvider: users.base.wallet.publicKey,
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
        users.base.wallet.payer
      );

      const mintBToken = new SPLToken(
        provider.connection,
        initializeArgs.tokenB.mint,
        TOKEN_PROGRAM_ID,
        users.base.wallet.payer
      );

      const aToken = await mintAToken.createAccount(
        users.base.wallet.publicKey
      );
      const bToken = await mintBToken.createAccount(
        users.base.wallet.publicKey
      );
      await mintAToken.mintTo(
        aToken,
        users.base.wallet.publicKey,
        [],
        INITIAL_BASE_AMOUNT
      );
      await mintBToken.mintTo(
        bToken,
        users.base.wallet.publicKey,
        [],
        INITIAL_BASE_AMOUNT
      );

      let sdk: QuarrySDK = QuarrySDK.load({
        provider,
      });

      mintWrapper = sdk.mintWrapper;
      mine = sdk.mine;

      rewardsMintKP = Keypair.generate();
      rewardsMint = rewardsMintKP.publicKey;

      let baseToken = SToken.fromMint(rewardsMint, DEFAULT_DECIMALS);
      // let baseToken = SToken.fromMint(initializeArgs.tokenA.mint, DEFAULT_DECIMALS);
      let baseHardCap = TokenAmount.parse(
        baseToken,
        DEFAULT_HARD_CAP.toString()
      );
      const { tx, mintWrapper: wrapperKey } = await mintWrapper.newWrapper({
        hardcap: baseHardCap.toU64(),
        // tokenMint: initializeArgs.tokenA.mint, // base Mint
        tokenMint: rewardsMint,
      });
      
      const mintIx = SPLToken.createInitMintInstruction(
        stablePoolProgram.programId,
        rewardsMintKP,
        DEFAULT_DECIMALS,
        wrapperKey,
        wrapperKey
      );
      const txn = new Transaction().add(mintIx);
      // try to use the one above pls
      let txInitMint = await createInitMintInstructions({
        provider,
        mintKP: rewardsMintKP, // Account with signing authority on the original token (baseToken)
        decimals: DEFAULT_DECIMALS,
        mintAuthority: wrapperKey,
        freezeAuthority: wrapperKey,
      });
      await txInitMint.confirm();
      await tx.confirm();
      mintWrapperKey = wrapperKey;
      rewardsMintToken = new SPLToken(
        provider.connection,
        rewardsMint,
        TOKEN_PROGRAM_ID,
        users.base.wallet.payer
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
      let txMinter = await mintWrapper.newMinterWithAllowance(
        mintWrapperKey,
        minterId,
        allowance
      );
      await txMinter.confirm();
      [minter] = await anchor.web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("MintWrapperMinter"),
          mintWrapperKey.toBuffer(),
          minterId.toBuffer(),
        ],
        QUARRY_ADDRESSES.MintWrapper
      );
      const rate_tx = rewarder.setAnnualRewards({
        newAnnualRate: new u64(1000_000_000),
      });
      await rate_tx.confirm();
      const { quarry: quarryKey, tx: txQuarry } = await rewarder.createQuarry({
        // token: baseToken,
        token: poolMintToken,
      });
      await txQuarry.confirm();

      let quarry = await rewarder.getQuarry(poolMintToken);
      const share_tx = await quarry.setRewardsShare(new u64(10_000));
      share_tx.confirm();
      let txMiner = (await quarry.createMiner()).tx;
      await txMiner.confirm();

      const minerKey = await quarry.getMinerAddress(
        users.base.wallet.publicKey
      );
      let miner = await quarry.getMiner(users.base.wallet.publicKey);
      const minerVaultKey = miner?.tokenVaultKey;
      saberFarmMiner = minerKey;
      saberFarmMinerVault = minerVaultKey!;
      saberFarmQuarry = quarryKey;
      userLPTokenKey = await accounts.mintLpSaber.createAccount(
        users.base.wallet.publicKey
      );

      const depositTx = new Transaction().add(
        newSwap.deposit({
          userAuthority: users.base.wallet.publicKey,
          sourceA: aToken,
          sourceB: bToken,
          poolTokenAccount: userLPTokenKey,
          tokenAmountA: new u64(INITIAL_BASE_AMOUNT / 2),
          tokenAmountB: new u64(INITIAL_BASE_AMOUNT / 2),
          minimumPoolTokenAmount: new u64(0),
        })
      );
      await userProvider.send(depositTx, [], {});
      const lpTokenAmount = await getTokenAmount(userLPTokenKey);
      console.log("Deposited ", lpTokenAmount.toString());

      userRewardKey = await rewardsMintToken.createAccount(
        users.base.wallet.publicKey
      );
      feeCollectorKey = await rewardsMintToken.createAccount(FEE_OWNER);

      console.log("saberSwapMintKey", saberSwapMintKey.toString());
      console.log("saberFarmQuarry", saberFarmQuarry.toString());
      console.log("saberFarmMiner", saberFarmMiner.toString());
      console.log("saberFarmMinerVault", saberFarmMinerVault.toString());
      console.log("saberFarmRewarder", saberFarmRewarder.toString());
      console.log("mintWrapperKey", mintWrapperKey.toString());
      console.log("minter", minter.toString());
      console.log("rewardsTokenMint", rewardsTokenMintKey.toString());
      console.log(
        "claimFeeTokenAccount",
        rewarderClaimFeeTokenAccount.toString()
      );
      console.log("userLPTokenKey", userLPTokenKey);
    }
  });
  it("Create PDA", async () => {
    console.log("Program ID", stablePoolProgram.programId.toBase58());
    console.log("global State pubkey =", accounts.global.pubKey.toBase58());
    console.log("USD mint pubkey =", accounts.mintUsd.pubKey.toBase58());
    console.log("vault pubkey =", accounts.vaultLpSaber.pubKey.toBase58());
    console.log("trove pubkey =", users.base.troveLpSaber.pubKey.toBase58());
  });

  it("Create Global State", async () => {
    try {
      const globalState = await stablePoolProgram.account.globalState.fetch(
        accounts.global.pubKey
      );
      console.log("Global state is already created", globalState);
    } catch {
      console.log("Creating global state");

      let txHash = await stablePoolProgram.rpc
        .createGlobalState(
          accounts.global.bump,
          accounts.mintUsd.bump,
          new BN(100_000_000_000_000),
          new BN(100_000_000_000_000),
          {
            accounts: {
              globalState: accounts.global.pubKey,
              authority: users.super.wallet.publicKey,
              mintUsd: accounts.mintUsd.pubKey,
              ...defaultAccounts,
            },
            signers: [users.super.wallet.payer],
          }
        )
        .catch((e) => {
          console.log("e =", e);
        });
      console.log("txHash =", txHash);

      const globalState = await stablePoolProgram.account.globalState.fetch(
        accounts.global.pubKey
      );

      assert(
        globalState.authority.toBase58() ==
          users.super.wallet.publicKey.toBase58()
      );
      assert(
        globalState.mintUsd.toBase58() == accounts.mintUsd.pubKey.toBase58()
      );
    }
  });
  it("Set Harvest Fee params", async () => {
    let txHash = await stablePoolProgram.rpc.setHarvestFee(
      new BN(1),
      new BN(1000),
      {
        accounts: {
          globalState: accounts.global.pubKey,
          authority: users.super.wallet.publicKey,
        },
        signers: [users.super.wallet.payer],
      }
    );

    const globalState = await stablePoolProgram.account.globalState.fetch(
      accounts.global.pubKey
    );
    console.log("Fee Param result", globalState);
    assert(globalState.feeNum.toString() == "1");
    assert(globalState.feeDeno.toString() == "1000");
  });
  it("Create Token Vault", async () => {
    const globalState = await stablePoolProgram.account.globalState.fetch(
      accounts.global.pubKey
    );
    try {
      const vault = await stablePoolProgram.account.vault.fetch(
        accounts.vaultLpSaber.pubKey
      );
      console.log("Token Vault already exists", vault);
    } catch {
      const riskLevel = 4;
      const isDual = 0;
      console.log("Creating Token Vault");

      let txHash = await stablePoolProgram.rpc
        .createVault(
          accounts.vaultLpSaber.bump,
          riskLevel,
          isDual,
          new BN(100_000_000_000_000),
          TYPE_ID_SABER,
          {
            accounts: {
              authority: users.super.wallet.publicKey,
              vault: accounts.vaultLpSaber.pubKey,
              globalState: accounts.global.pubKey,
              mintColl: saberSwapMintKey,
              ...defaultAccounts,
            },
            signers: [users.super.wallet.payer],
          }
        )
        .catch((e) => {
          console.log("Creating Vault Error:", e);
        });

      let vault = await stablePoolProgram.account.vault.fetch(
        accounts.vaultLpSaber.pubKey
      );
      assert(vault.platformType == TYPE_ID_SABER, "PlatfromType mismatch");
    }
  });

  it("Create User Trove", async () => {
    try {
      const trove = await stablePoolProgram.account.trove.fetch(
        users.base.troveLpSaber.pubKey
      );
      console.log("User Trove already created:", trove);
    } catch {
      const tx1 = await stablePoolProgram.transaction.createTrove(
        users.base.troveLpSaber.bump,
        users.base.ataTroveLpSaber.bump,
        new anchor.BN(0),
        {
          accounts: {
            vault: accounts.vaultLpSaber.pubKey,
            trove: users.base.troveLpSaber.pubKey,

            authority: users.base.wallet.publicKey,

            ataTrove: users.base.ataTroveLpSaber.pubKey,
            mintColl: saberSwapMintKey,

            ...defaultAccounts,
          },
        }
      );
      await userProvider.send(tx1, [], {});

      let trove = await stablePoolProgram.account.trove.fetch(
        users.base.troveLpSaber.pubKey
      );

      assert(
        trove.lockedCollBalance.toString() == "0",
        "lockedCollBalance mismatch"
      );
      assert(trove.debt.toString() == "0", "debt mismatch");
    }
  });

  it("Create User Reward Vault", async () => {
    [userTroveRewardKey, userTroveRewardNonce] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(constants.TROVE_POOL_SEED),
          users.base.troveLpSaber.pubKey.toBuffer(),
          rewardsTokenMintKey.toBuffer(),
        ],
        stablePoolProgram.programId
      );
    try {
      let reward = await rewardsMintToken.getAccountInfo(userTroveRewardKey);
      console.log("User Trove Reward token already created");
    } catch {
      const tx1 = await stablePoolProgram.transaction.createUserRewardVault(
        userTroveRewardNonce,
        {
          accounts: {
            authority: users.base.wallet.publicKey,
            trove: users.base.troveLpSaber.pubKey,
            vault: accounts.vaultLpSaber.pubKey,

            rewardVault: userTroveRewardKey,
            rewardMint: rewardsTokenMintKey,

            ...defaultAccounts,
          },
        }
      );
      await userProvider.send(tx1, [], {});

      let trove = await stablePoolProgram.account.trove.fetch(
        users.base.troveLpSaber.pubKey
      );

      assert(
        trove.lockedCollBalance.toString() == "0",
        "lockedCollBalance mismatch"
      );
      assert(trove.debt.toString() == "0", "debt mismatch");
    }
  });

  it("Create Quarry Miner", async () => {
    [userMinerKey, userMinerBump] = await findMinerAddress(
      saberFarmQuarry,
      users.base.troveLpSaber.pubKey
    );

    [userMinerVaultKey, userMinerVaultBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("Miner-Vault"),
          userMinerKey.toBuffer(),
          saberSwapMintKey.toBuffer(),
        ],
        stablePoolProgram.programId
      );
    try {
      let sdk: QuarrySDK = QuarrySDK.load({ provider });
      let rewarder = await sdk.mine.loadRewarderWrapper(saberFarmRewarder);

      const poolMintToken = SToken.fromMint(saberSwapMintKey, DEFAULT_DECIMALS);
      let quarry = await rewarder.getQuarry(poolMintToken);

      const minerKey = await quarry.getMinerAddress(users.base.troveLpSaber.pubKey);
      let miner = await quarry.getMiner(users.base.troveLpSaber.pubKey);

      assert(miner != null, "Miner created already");
      const minerVaultKey = miner?.tokenVaultKey;

      saberFarmMiner = minerKey;
      saberFarmMinerVault = minerVaultKey!;
    } catch (e) {
      console.log("Creating Miner account");
      const tx1 = await stablePoolProgram.transaction.createQuarryMiner(
        userMinerBump,
        userMinerVaultBump,
        {
          accounts: {
            vault: accounts.vaultLpSaber.pubKey,
            trove: users.base.troveLpSaber.pubKey,
            payer: users.base.wallet.publicKey,
            miner: userMinerKey,
            quarry: saberFarmQuarry,
            rewarder: saberFarmRewarder,
            minerVault: userMinerVaultKey,
            tokenMint: saberSwapMintKey,
            quarryProgram: QUARRY_ADDRESSES.Mine,
            ...defaultAccounts,
          },
        }
      );
      await userProvider.send(tx1, [], {});

      saberFarmMiner = userMinerKey;
      saberFarmMinerVault = userMinerVaultKey;
    }
  });

  it("Deposit to Saber", async () => {
    const globalState = await stablePoolProgram.account.globalState.fetch(
      accounts.global.pubKey
    );

    await stablePoolProgram.rpc
      .depositToSaber(new anchor.BN(depositAmount), {
        accounts: {
          ratioStaker: {
            globalState: accounts.global.pubKey,
            vault: accounts.vaultLpSaber.pubKey,
            trove: users.base.troveLpSaber.pubKey,
            owner: users.base.wallet.publicKey,
            poolTokenColl: users.base.ataTroveLpSaber.bump,
            userTokenColl: userLPTokenKey,
            mintColl: saberSwapMintKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          saberFarm: {
            quarry: saberFarmQuarry,
            miner: saberFarmMiner,
            minerVault: saberFarmMinerVault,
          },
          saberFarmRewarder,
          saberFarmProgram: SABER_FARM_PROGRAM,
        },
        signers: [users.base.wallet.payer],
      })
      .catch((e) => {
        console.log("Deposit Collateral Error:", e);
      });

    let trove = await stablePoolProgram.account.trove.fetch(
      users.base.troveLpSaber.pubKey
    );
    let vault = await stablePoolProgram.account.vault.fetch(
      accounts.vaultLpSaber.pubKey
    );

    console.log("depositAmount mismatch: totalColl = " + vault.totalColl);
    console.log(
      "lockedCollBalance mismatch: lockedCollBalance = " +
        trove.lockedCollBalance
    );

    let poolLpTokenAccount = await accounts.mintLpSaber.getAccountInfo(
      users.base.ataTroveLpSaber.pubKey
    );
    let userLpTokenAccount = await accounts.mintLpSaber.getAccountInfo(
      userLPTokenKey
    );

    console.log(
      "poolLpTokenAccount.amount =",
      poolLpTokenAccount.amount.toString()
    );
    console.log(
      "userLpTokenAccount.amount =",
      userLpTokenAccount.amount.toString()
    );
  });
  it("Harvest from Saber", async () => {
    await sleep(5000);
    let txhash = await stablePoolProgram.rpc
      .harvestFromSaber({
        accounts: {
          ratioHarvester: {
            globalState: accounts.global.pubKey,
            vault: accounts.vaultLpSaber.pubKey,
            trove: users.base.troveLpSaber.pubKey,

            authority: users.base.wallet.publicKey,

            userTroveReward: userTroveRewardKey,
            userRewardToken: userRewardKey,
            rewardFeeToken: feeCollectorKey,
            mintColl: saberSwapMintKey,
            ...defaultAccounts,
          },
          saberFarm: {
            quarry: saberFarmQuarry,
            miner: saberFarmMiner,
            minerVault: saberFarmMinerVault,
          },
          ataUserColl: users.base.ataTroveLpSaber.bump,
          saberFarmRewarder,
          saberFarmProgram: SABER_FARM_PROGRAM,

          mintWrapper: mintWrapperKey,
          mintWrapperProgram: QUARRY_ADDRESSES.MintWrapper,

          minter,
          rewardsTokenMint: rewardsTokenMintKey,
          claimFeeTokenAccount: rewarderClaimFeeTokenAccount,
        },
        signers: [users.base.wallet.payer],
      })
      .catch((e) => {
        console.log("Harvest Reward Error:", e);
      });

    let reward = await rewardsMintToken.getAccountInfo(userRewardKey);
    let fee = await rewardsMintToken.getAccountInfo(feeCollectorKey);

    console.log(txhash);

    console.log("reward.amount =", reward.amount.toString());
    console.log("fee.amount =", fee.amount.toString());
  });

  it("Withdraw from Saber", async () => {
    await stablePoolProgram.rpc
      .withdrawFromSaber(new BN(depositAmount), {
        accounts: {
          ratioStaker: {
            globalState: accounts.global.pubKey,
            vault: accounts.vaultLpSaber.pubKey,
            trove: users.base.troveLpSaber.pubKey,
            owner: users.base.wallet.publicKey,
            poolTokenColl: users.base.ataTroveLpSaber.bump,
            userTokenColl: userLPTokenKey,
            mintColl: saberSwapMintKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          saberFarm: {
            quarry: saberFarmQuarry,
            miner: saberFarmMiner,
            minerVault: saberFarmMinerVault,
          },
          saberFarmRewarder,
          saberFarmProgram: SABER_FARM_PROGRAM,
        },
        signers: [users.base.wallet.payer],
      })
      .catch((e) => {
        console.log("Withdraw Collateral Error:", e);
      });

    let trove = await stablePoolProgram.account.trove.fetch(
      users.base.troveLpSaber.pubKey
    );
    let vault = await stablePoolProgram.account.vault.fetch(
      accounts.vaultLpSaber.pubKey
    );

    console.log("depositAmount mismatch: totalColl = " + vault.totalColl);
    console.log(
      "lockedCollBalance mismatch: lockedCollBalance = " +
        trove.lockedCollBalance
    );

    let poolLpTokenAccount = await accounts.mintLpSaber.getAccountInfo(
      users.base.ataTroveLpSaber.pubKey
    );
    let userLpTokenAccount = await accounts.mintLpSaber.getAccountInfo(
      userLPTokenKey
    );

    console.log(
      "poolLpTokenAccount.amount =",
      poolLpTokenAccount.amount.toString()
    );
    console.log(
      "userLpTokenAccount.amount =",
      userLpTokenAccount.amount.toString()
    );
  });
});

async function getTokenAmount(account: PublicKey) {
  const amount: Number = await anchorProvider.connection.getBalance(account);
  return amount;
}
