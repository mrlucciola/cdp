// anchor/solana
import { BN, Program, Wallet, workspace } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
// local
import { StablePool } from "../../target/types/stable_pool";
import { DECIMALS_USDX } from "../utils/constants";
import { addZeros, handleTxn } from "../utils/fxns";
// interfaces
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";
import { MintPubKey } from "../utils/interfaces";
import { Pool } from "../interfaces/pool";
import { TokenPDAUser } from "../interfaces/TokenPDA";
import { TokenCollatUser } from "../interfaces/TokenCollatUser";
import { GlobalState } from "../interfaces/GlobalState";
import { TokenCollat } from "../interfaces/TokenCollat";
import { UserState } from "../interfaces/userState";
import { Vault } from "../interfaces/vault";

// init
const programStablePool = workspace.StablePool as Program<StablePool>;

// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
export const borrowUsdxCall = async (
  borrowAmount: number,
  userConnection: Connection,
  userWallet: Wallet,
  tokenCollatUser: TokenCollatUser,
  userUSDx: TokenPDAUser,
  pool: Pool,
  globalState: GlobalState,
  tokenCollat: TokenCollat,
  userState: UserState,
  vault: Vault
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.borrowUsdx(new BN(borrowAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,
        pool: pool.pubKey,

        vault: tokenCollatUser.vault.pubKey,
        userState: userState.pubKey,

        ataUsdx: userUSDx.ata.pubKey,
        ataCollatVault: vault.ataCollat.pubKey,
        ataCollatMiner: vault.miner.ata.pubKey,
        ataMarketA: pool.ataMarketTokens.usdc.pubKey,
        ataMarketB: pool.ataMarketTokens.usdt.pubKey,

        oracleA: pool.oracles.usdc.pubKey,
        oracleB: pool.oracles.usdt.pubKey,

        mintCollat: tokenCollat.mint, // the collat token mint that the pool represents
        mintUsdx: userUSDx.tokenPda.pubKey,

        // system accts
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
  console.log(
    "tokenCollatUser ata balance",
    await tokenCollatUser.ata.getBalance()
  );
};
// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
export const borrowUsdxPASS = async (user: User, accounts: Accounts) => {
  const tokenUsdxUser = user.tokens.usdx;
  const borrowAmtUi = 100;
  const borrowAmtPrecise = addZeros(borrowAmtUi, DECIMALS_USDX);

  // create the ata
  // const doesExistOnChain = await user.connection user.tokens.usdx.ata;
  const doesExistOnChain = await tokenUsdxUser.ata.getAccountInfo();

  !doesExistOnChain && (await tokenUsdxUser.ata.initAta());

  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
  await borrowUsdxCall(
    // borrow/mint amount
    borrowAmtPrecise,
    // user connection
    user.provider.connection,
    // user wallet
    user.wallet,
    // tokenCollatUser
    user.tokens.lpSaber,
    // tokenUsdxUser
    tokenUsdxUser,
    // pool
    accounts.lpSaberUsdcUsdt.pool,
    // globalState
    accounts.global,
    // mintColl
    accounts.lpSaberUsdcUsdt,
    user.userState,
    user.tokens.lpSaber.vault
  );

  const userBalPost = Number(
    (await tokenUsdxUser.ata.getBalance()).value.amount
  );
  console.log(`user USDX balance: ${0} -> ${userBalPost} ∆=${userBalPost}`);
};
