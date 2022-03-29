// anchor/solana
import {
  BN,
  IdlAccounts,
  Program,
  Wallet,
  workspace,
} from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
// quarry
import { QUARRY_ADDRESSES } from "@quarryprotocol/quarry-sdk";
// local
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import {
  GlobalStateAcct,
  Miner,
  MintPubKey,
  Pool,
  User,
  UserToken,
  Pool,
  Vault,
} from "../utils/interfaces";
import { assert } from "chai";
import { handleTxn } from "../utils/fxns";
import { DECIMALS_USD, DECIMALS_USDCUSDT } from "../utils/constants";

const programStablePool = workspace.StablePool as Program<StablePool>;

const harvestFromSaberCall = async (
  userConnection: Connection,
  userWallet: Wallet,
  userToken: UserToken,
  ataUserReward: PublicKey,
  vault: Vault,
  ataVaultReward: PublicKey,
  mintPubKey: MintPubKey,
  pool: Pool,
  globalState: GlobalStateAcct,
  ataFeeReward: PublicKey,
  rewarder: PublicKey,
  quarry: PublicKey,
  miner: Miner,
  mintWrapper: PublicKey,
  minter: PublicKey,
  sbrMint: MintPubKey,
  claimFeeTokenAccount: PublicKey
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.harvestRewardSaber({
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,
        vault: vault.pubKey,
        ataVaultReward: ataVaultReward,
        ataUserReward,
        rewardFeeToken: ataFeeReward,
        mint: mintPubKey,

        quarry,
        miner: miner.pubkey,
        minerVault: miner.ata.pubKey,
        ataVaultColl: vault.ata.pubKey,
        rewarder,
        mintWrapper,
        rewardMint: sbrMint,
        minter,
        claimFeeTokenAccount,
        mintWrapperProgram: QUARRY_ADDRESSES.MintWrapper,
        quarryProgram: QUARRY_ADDRESSES.Mine,
        ...defaultAccounts,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
};
