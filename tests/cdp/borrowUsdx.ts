import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  LAMPORTS_PER_SOL,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { StablePool } from "../../target/types/stable_pool";
import { Accounts } from "../config/accounts";
import { USDX_DECIMALS } from "../utils/constants";
import { handleTxn } from "../utils/fxns";
import {
  GlobalStateAcct,
  MintAcct,
  MintPubKey,
  Trove,
  USDx,
  User,
  UserToken,
  Vault,
} from "../utils/interfaces";

const programStablePool = workspace.StablePool as Program<StablePool>;
// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
const borrowUsdxCall = async (
  borrowAmount: number,
  userConnection: Connection,
  userWallet: Wallet,
  userToken: UserToken,
  userUSDx: USDx,
  mintUsdx: MintAcct,
  vault: Vault,
  globalState: GlobalStateAcct,
  mintColl: MintPubKey,
) => {
  console.log(new BN(borrowAmount), {
    accounts: {
      authority: userWallet.publicKey,
      globalState: globalState.pubKey,

      oracleA: vault.oracles.usdc.pubKey,
      oracleB: vault.oracles.usdt.pubKey,
      ataMarketA: vault.ataMarketTokens.usdc.pubKey,
      ataMarketB: vault.ataMarketTokens.usdt.pubKey,

      mintColl, // the collat token mint that the vault represents
      vault: vault.pubKey,
      trove: userToken.trove.pubKey,

      mintUsdx: mintUsdx.pubKey,
      ataUsdx: userUSDx.ata.pubKey,
      
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    },
  })
  console.log(new BN(borrowAmount), {
    accounts: {
      authority: userWallet.publicKey,
      globalState: globalState.pubKey,
      oracleA: await vault.oracles.usdc.getAccountInfo(),
      oracleB: await vault.oracles.usdt.getAccountInfo(),
      ataMarketA: await vault.ataMarketTokens.usdc.getAccountInfo(),
      ataMarketB: await vault.ataMarketTokens.usdt.getAccountInfo(),
      vault: vault.pubKey,
      trove: userToken.trove.pubKey,
      mintUsdx: await mintUsdx.getAccountInfo(),
      ataUsdx: await userUSDx.ata.getAccountInfo(),
    },
  })

  const txn = new Transaction().add(
    programStablePool.instruction.borrowUsdx(
      new BN(borrowAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,

        oracleA: vault.oracles.usdc.pubKey,
        oracleB: vault.oracles.usdt.pubKey,
        ataMarketA: vault.ataMarketTokens.usdc.pubKey,
        ataMarketB: vault.ataMarketTokens.usdt.pubKey,

        mintColl, // the collat token mint that the vault represents
        vault: vault.pubKey,
        trove: userToken.trove.pubKey,

        mintUsdx: mintUsdx.pubKey,
        ataUsdx: userUSDx.ata.pubKey,

        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
};
// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
export const borrowUsdxPASS = async (user: User, accounts: Accounts) => {
  const usdxUser = user.tokens.usdx;

  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
  await borrowUsdxCall(
    // borrow/mint amount
    900 * USDX_DECIMALS,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // userToken
    user.tokens.lpSaber,
    // userUSDx
    user.tokens.usdx,
    // mintUsdx
    accounts.usdx,
    // vault
    accounts.lpSaberUsdcUsdt.vault,
    // globalState
    accounts.global,
    // mintColl
    accounts.lpSaberUsdcUsdt.mint
  );

  const userBalPost = (await usdxUser.ata.getBalance()).value.uiAmount;
  const userDiff = userBalPost - 0;
  console.log(
    `user USDX balance: ${0} -> ${userBalPost} ∆=${userDiff}`
  );
};
