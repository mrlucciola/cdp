import { Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import { handleTxn } from "../utils/fxns";
import { User } from "../interfaces/user";
import { assert } from "chai";
import { Pool } from "../interfaces/pool";
import { Vault } from "../interfaces/vault";
import { TokenRewardUser } from "../interfaces/TokenReward";
import { GlobalState } from "../interfaces/GlobalState";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

const harvestRewardCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  userRewardToken: TokenRewardUser,
  globalState: GlobalState,
  treasury: PublicKey,
  ataTreasurySbr: PublicKey,
  pool: Pool,
  vault: Vault,
  mintRewardPubkey: PublicKey
) => {
  const userRewardBalPre = Number(
    (await userConnection.getTokenAccountBalance(userRewardToken.ata.pubKey))
      .value.amount
  );
  const treasuryBalPre = Number(
    (await userConnection.getTokenAccountBalance(ataTreasurySbr)).value.amount
  );
  const rewardVaultBalPre = Number(
    (await userConnection.getTokenAccountBalance(vault.ataReward.pubKey)).value
      .amount
  );

  const txn = new Transaction().add(
    programStablePool.instruction.harvestRewardsFromSaber({
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        ataRewardVault: vault.ataReward.pubKey,
        ataRewardUser: userRewardToken.ata.pubKey,
        ataCdpTreasury: ataTreasurySbr,
        treasury,
        mintReward: mintRewardPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);

  const userRewardBalPost = Number(
    (await userConnection.getTokenAccountBalance(userRewardToken.ata.pubKey))
      .value.amount
  );
  const treasuryBalPost = Number(
    (await userConnection.getTokenAccountBalance(ataTreasurySbr)).value.amount
  );
  const rewardVaultBalPost = Number(
    (await userConnection.getTokenAccountBalance(vault.ataReward.pubKey))
      .value.amount
  );
  const userGain = userRewardBalPost - userRewardBalPre;
  console.log("user's gain =", userGain);
  const harvestFee = treasuryBalPost - treasuryBalPre;
  console.log("harvestFee =", harvestFee);

  const harvestFeeNum = (await globalState.getAccount()).feeNum.toNumber();
  const harvestFeeDeno = (await globalState.getAccount()).feeDeno.toNumber();
  console.log("harvestFeeRate =", harvestFeeNum / harvestFeeDeno);
  assert(rewardVaultBalPost === 0, "Not harvested all rewards.");
  assert(
    userGain + harvestFee === rewardVaultBalPre,
    "Harvested rewards mismatch with sum of user's gain and harvest fee"
  );
  assert(
    harvestFee ===
      Math.floor((rewardVaultBalPre * harvestFeeNum) / harvestFeeDeno),
    "Fee calculation is not correct"
  );
};

export const harvestRewardsPASS = async (
  user: User,
  treasury: User,
  accounts: Accounts
) => {
  const confirmation = await harvestRewardCall(
    user.provider.connection, // userConnection
    user.wallet, // userWallet
    user.tokens.sbr, // userRewardToken
    accounts.global, // global state
    treasury.wallet.publicKey, // treasury
    treasury.tokens.sbr.ata.pubKey, // ataTreasurySbr
    accounts.lpSaberUsdcUsdt.pool, // pool
    user.tokens.lpSaber.vault, // vault,
    accounts.sbr.mint // mintRewardPubkey
  );
};
