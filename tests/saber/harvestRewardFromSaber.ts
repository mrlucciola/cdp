// anchor/solana
import { Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
// quarry
import { SignerWallet } from "@saberhq/solana-contrib";
import { Token as SToken } from "@saberhq/token-utils";
import { QuarrySDK, QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// local
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import {
  GlobalStateAcct,
  MintPubKey,
  Pool,
  UserToken,
  Vault,
} from "../utils/interfaces";
import { assert } from "chai";
import { handleTxn } from "../utils/fxns";
import { DECIMALS_USDCUSDT } from "../utils/constants";
import { User } from "../interfaces/user";
import { Miner } from "../interfaces/miner";

const programStablePool = workspace.StablePool as Program<StablePool>;

const harvestFromSaberCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  userRewardToken: UserToken, // prev: ataSBRKey
  globalState: GlobalStateAcct,
  treasury: PublicKey,
  ataTreasurySbr: PublicKey,
  pool: Pool,
  vault: Vault,
  miner: Miner,
  rewarder: PublicKey,
  quarry: PublicKey,
  minter: PublicKey,
  mintWrapper: PublicKey,
  mintWrapperProgram: PublicKey,
  tokenMint: MintPubKey,
  mintRewardPubkey: PublicKey, // mintSbrPubkey
  claimFeeTokenAccount: PublicKey
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.harvestRewardsFromSaber({
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        ataRewardVault: vault.ataRewards[0].pubKey,
        ataUserReward: userRewardToken.ata.pubKey,
        ataCdpTreasury: ataTreasurySbr, // this is SBR for this example
        treasury,
        mint: tokenMint,
        quarry,
        miner: miner.pubkey,
        minerVault: miner.ata.pubKey,
        ataCollatVault: vault.ata.pubKey,
        // quarry-specific accounts
        rewarder,
        mintWrapper,
        mintWrapperProgram,
        minter,
        claimFeeTokenAccount, // is this a quarry-specific account
        // system accounts
        mintReward: mintRewardPubkey, // SBR for this example
        quarryProgram: QUARRY_ADDRESSES.Mine,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })
  );
  await handleTxn(txn, userConnection, userWallet);
};

export const harvestRewardsFromSaberPASS = async (
  user: User,
  treasury: User, // TODO: add treasury to users - this is super for now
  accounts: Accounts
) => {
  const confirmation = await harvestFromSaberCall(
    user.provider.connection, // userConnection
    user.wallet, // userWallet
    user.tokens.sbr, // userRewardToken
    accounts.global, // global state
    treasury.wallet.publicKey, // treasury
    treasury.tokens.sbr.ata.pubKey, // ataTreasurySbr
    accounts.lpSaberUsdcUsdt.pool, // pool
    user.tokens.lpSaber.vault, // vault,
    user.miner, // minerKeys
    // TODO 002: move quarry into pool class
    accounts.quarry.rewarder, // rewarderKey
    // TODO 002: move quarry into pool class
    accounts.quarry.pubkey, // quarryKey
    // TODO 002: move quarry into pool class
    accounts.quarry.minter, // mintWrapper
    // TODO 002: move quarry into pool class
    accounts.quarry.mintWrapper, // minter
    QUARRY_ADDRESSES.MintWrapper, // mintWrapperProgram
    accounts.lpSaberUsdcUsdt.mint, // tokenMint
    accounts.sbr.mint, // mintRewardPubkey
    // TODO 002: move quarry into pool class
    accounts.quarry.rewardClaimFeeAccount // claimFeeTokenAccount
    // treasury.tokens.ataSBRKey, // ataTreasurySbr
  );

  const userQuarryProvider = new SignerWallet(
    (user.wallet as any).payer
  ).createProvider(user.provider.connection);
  const sdk: QuarrySDK = QuarrySDK.load({ provider: userQuarryProvider });
  // TODO 002: move quarry into pool class
  const rewarder = await sdk.mine.loadRewarderWrapper(accounts.quarry.rewarder); // .rewarderKey

  const poolMintToken = SToken.fromMint(
    accounts.lpSaberUsdcUsdt.mint,
    DECIMALS_USDCUSDT
  );
  const quarry = await rewarder.getQuarry(poolMintToken);

  const miner = await quarry.getMiner(user.tokens.lpSaber.vault.pubKey);
  assert(
    miner.authority.equals(user.tokens.lpSaber.vault.pubKey),
    "Miner'authority mismatch"
  );
};
