import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import * as anchor from '@project-serum/anchor';
import { u64, TOKEN_PROGRAM_ID, Token, AccountInfo, AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { decodeUserFarmBuffer, decodeGlobalFarmBuffer, generateBufferData, INIT_USER_FARM_DATA_LAYOUT, uint64 } from './layout';

import { ORCA_FARM_ID, OrcaU64 } from "@orca-so/sdk";
const BufferLayout = require('buffer-layout');

const connection = new Connection("https://api.devnet.solana.com", "singleGossip");

export enum INSTRUCTIONS {
InitGlobalFarm,
InitUserFarm,
ConvertTokens,
RevertTokens,
Harvest,
RemoveRewards,
SetEmissionsPerSecond,
}

export const getOrCreateAssociatedTokenAccountIx = async (
  owner: PublicKey,
  mint: PublicKey,
  arrIx: TransactionInstruction[]
) => {
  let tokenAccountPk = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, owner);
  let tokenAccount = await connection.getAccountInfo(tokenAccountPk);
  if (tokenAccount == null || !deserializeTokenAccount(tokenAccount?.data)) {
    arrIx.push(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, tokenAccountPk, owner, owner
      )
    );
  }
  return tokenAccountPk;
}

export const getOrCreateATokenAccountIx = async (
  owner: PublicKey,
  allowOwnerOffCurve: boolean,
  payer: PublicKey,
  mint: PublicKey,
  arrIx: TransactionInstruction[]
) => {
  let tokenAccountPk = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, owner, allowOwnerOffCurve);
  let tokenAccount = await connection.getAccountInfo(tokenAccountPk);
  if (tokenAccount == null || !deserializeTokenAccount(tokenAccount?.data)) {
    arrIx.push(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, tokenAccountPk, owner, payer
      )
    );
  }
  return tokenAccountPk;
}

export async function getAuthorityAndNonce(
  publicKey: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress([publicKey.toBuffer()], programId);
}

export const getOrcaUserFarm = async (
  globalFarmAddress: PublicKey, 
  userPk: PublicKey
) => {
  let userFarmAddress = (
    await PublicKey.findProgramAddress(
      [globalFarmAddress.toBuffer(), userPk.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()], ORCA_FARM_ID)
  )[0];
  let userFarm = await connection.getAccountInfo(userFarmAddress);
  if (userFarm == null) {
    return {userFarmAddress, userFarm: null};
  }

  let userFarmData = decodeUserFarmBuffer(userFarm);
  return {userFarmAddress, userFarmData};
}
export const getOrcaGlobalFarm = async (
      globalFarmAddress: PublicKey
) => {
  let globalFarm = await connection.getAccountInfo(globalFarmAddress);
  if (globalFarm == null) {
      throw new Error("Fail to get GlobalFarm");
  }
  let globalFarmData = decodeGlobalFarmBuffer(globalFarm);
  return globalFarmData;
}


export const deserializeTokenAccount = (data: Buffer | undefined): AccountInfo | undefined => {
if (data == undefined || data.length == 0) {
  return undefined;
}

const accountInfo = AccountLayout.decode(data);
accountInfo.mint = new PublicKey(accountInfo.mint);
accountInfo.owner = new PublicKey(accountInfo.owner);
accountInfo.amount = u64.fromBuffer(accountInfo.amount);

if (accountInfo.delegateOption === 0) {
  accountInfo.delegate = null;
  accountInfo.delegatedAmount = new u64(0);
} else {
  accountInfo.delegate = new PublicKey(accountInfo.delegate);
  accountInfo.delegatedAmount = u64.fromBuffer(accountInfo.delegatedAmount);
}

accountInfo.isInitialized = accountInfo.state !== 0;
accountInfo.isFrozen = accountInfo.state === 2;

if (accountInfo.isNativeOption === 1) {
  accountInfo.rentExemptReserve = u64.fromBuffer(accountInfo.isNative);
  accountInfo.isNative = true;
} else {
  accountInfo.rentExemptReserve = null;
  accountInfo.isNative = false;
}

if (accountInfo.closeAuthorityOption === 0) {
  accountInfo.closeAuthority = null;
} else {
  accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
}

return accountInfo;
};


// serious modify
export function constructInitUserFarmIx(
globalFarmStatePubkey: PublicKey,
userFarmStatePubkey: PublicKey,
ownerPubkey: PublicKey,
aquafarmProgramId: PublicKey
): TransactionInstruction {
const keys = [
  {
    pubkey: globalFarmStatePubkey,
    isSigner: false,
    isWritable: false,
  },
  {
    pubkey: userFarmStatePubkey,
    isSigner: false,
    isWritable: true,
  },
  {
    pubkey: ownerPubkey,
    isSigner: true,
    isWritable: false,
  },
  {
    pubkey: SystemProgram.programId,
    isSigner: false,
    isWritable: false,
  },
];

return new TransactionInstruction({
  keys,
  programId: aquafarmProgramId,
  data: generateBufferData(INIT_USER_FARM_DATA_LAYOUT, {
    instruction: INSTRUCTIONS.InitUserFarm,
  }), // Initialize user farm instruction
});
}

export function constructConvertTokensIx(
userFarmOwner: PublicKey,
userTransferAuthority: PublicKey,
userBaseTokenAccountPubkey: PublicKey,
userFarmTokenAccountPubkey: PublicKey,
userRewardTokenAccountPubkey: PublicKey,
globalBaseTokenVaultPubkey: PublicKey,
farmTokenMintPubkey: PublicKey,
globalFarm: PublicKey,
userFarm: PublicKey,
globalRewardTokenVaultPubkey: PublicKey,
authority: PublicKey,
aquafarmProgramId: PublicKey,
amountToConvert: u64
): TransactionInstruction {
return new TransactionInstruction({
  keys: [
    {
      pubkey: userFarmOwner,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: userBaseTokenAccountPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: globalBaseTokenVaultPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: userTransferAuthority,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: farmTokenMintPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: userFarmTokenAccountPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: globalFarm,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: userFarm,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: globalRewardTokenVaultPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: userRewardTokenAccountPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: authority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
  ],
  programId: aquafarmProgramId,
  data: generateBufferData(
    BufferLayout.struct([
      BufferLayout.u8("instruction"),
      uint64("amountToConvert"),
    ]),
    {
      instruction: INSTRUCTIONS.ConvertTokens,
      amountToConvert: amountToConvert.toBuffer(), // The time period over which to distribute: 2 weeks
    }
  ),
});
}


export function constructRevertTokensIx(
userFarmOwner: PublicKey,
userBurnAuthority: PublicKey,
userBaseTokenAccountPubkey: PublicKey,
userFarmTokenAccountPubkey: PublicKey,
userRewardTokenAccountPubkey: PublicKey,
globalBaseTokenVaultPubkey: PublicKey,
farmTokenMintPubkey: PublicKey,
globalFarm: PublicKey,
userFarm: PublicKey,
globalRewardTokenVaultPubkey: PublicKey,
authority: PublicKey,
aquafarmProgramId: PublicKey,
amountToRevert: u64
) {
return new TransactionInstruction({
  keys: [
    {
      pubkey: userFarmOwner,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: userBaseTokenAccountPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: globalBaseTokenVaultPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: farmTokenMintPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: userFarmTokenAccountPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: userBurnAuthority,
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: globalFarm,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: userFarm,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: globalRewardTokenVaultPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: userRewardTokenAccountPubkey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: authority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
  ],
  programId: aquafarmProgramId,
  data: generateBufferData(
    BufferLayout.struct([
      BufferLayout.u8("instruction"),
      uint64("amountToRevert"),
    ]),
    {
      instruction: INSTRUCTIONS.RevertTokens,
      amountToRevert: amountToRevert.toBuffer(),
    }
  ),
});
}