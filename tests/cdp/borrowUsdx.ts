// anchor/solana imports
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
import { Accounts } from "../config/accounts";
import { DECIMALS_USDX } from "../utils/constants";
import { handleTxn } from "../utils/fxns";
import {
  GlobalStateAcct,
  MintAcct,
  MintPubKey,
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
  mintColl: MintPubKey
) => {
  const txn = new Transaction().add(
    programStablePool.instruction.borrowUsdx(new BN(borrowAmount), {
      accounts: {
        authority: userWallet.publicKey,
        globalState: globalState.pubKey,

        oracleA: vault.oracles.usdc.pubKey,
        oracleB: vault.oracles.usdt.pubKey,
        ataMarketA: vault.ataMarketTokens.usdc.pubKey,
        ataMarketB: vault.ataMarketTokens.usdt.pubKey,

        mintColl, // the collat token mint that the vault represents
        vault: vault.pubKey, // TODO: rename vault -> pool
        trove: userToken.trove.pubKey, // TODO: rename trove -> vault

        mintUsdx: mintUsdx.pubKey,
        ataUsdx: userUSDx.ata.pubKey,
        ataColl: userToken.ata.pubKey, // why do we need this?

        // system accts
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })
  );

  await handleTxn(txn, userConnection, userWallet);
  console.log(await userToken.ata.getBalance());
};
// THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
export const borrowUsdxPASS = async (user: User, accounts: Accounts) => {
  const usdxUser = user.tokens.usdx;
  const borrowAmtUi = 900;
  const borrowAmtPrecise = borrowAmtUi * 10 ** DECIMALS_USDX;

  // THIS IS NOT COMPLETE, please see note on the contract fxn (search `BorrowUsdx<'info>`)
  await borrowUsdxCall(
    // borrow/mint amount
    borrowAmtPrecise,
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

  const userBalPost = Number((await usdxUser.ata.getBalance()).value.amount);
  console.log(`user USDX balance: ${0} -> ${userBalPost} ∆=${userBalPost}`);
};
