// anchor imports
import {
  Provider,
  Program,
  web3,
  workspace,
  BN,
  IdlAccounts,
} from "@project-serum/anchor";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
// solana imports
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// utils
import { assert } from "chai";
// local
import { handleTxn } from "../utils/fxns";
import * as constants from "../utils/constants";
import { User, Users } from "../config/users";
import { Accounts } from "../config/accounts";
import { StablePool } from "../../target/types/stable_pool";

const programStablePool = workspace.StablePool as Program<StablePool>;

const createGlobalStateCall = async (accounts: Accounts, user: User) => {
  // create txn
  const txn = new web3.Transaction();
  // add instruction
  txn.add(
    programStablePool.instruction.createGlobalState(
      accounts.global.bump, // prev: globalStateNonce
      accounts.mintUsdx.bump, // prev: mintUsdNonce
      new BN(constants.TVL_LIMIT),
      new BN(constants.GLOBAL_DEBT_CEILING),
      {
        accounts: {
          authority: user.wallet.publicKey,
          globalState: accounts.global.pubKey,
          mintUsdx: accounts.mintUsdx.pubKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        // signers: [user.wallet.payer],
      }
    )
  );

  // send transaction
  const receipt = await handleTxn(txn, user);
  console.log("Global state creation confirmed: ", receipt);
};

export const createGlobalStatePASS = async (
  accounts: Accounts,
  superUser: User
) => {
  // create the global state account
  console.log(
    "global state: ",
    accounts.global.pubKey,
    "\n string:",
    accounts.global.pubKey.toString()
  );
  console.log(
    "mint: ",
    accounts.mintUsdx.pubKey,
    "\n string:",
    accounts.mintUsdx.pubKey.toString()
  );

  // check if global state exists. If not, create it
  const globalStateAccountInfo: web3.AccountInfo<Buffer> =
    await superUser.provider.connection.getAccountInfo(accounts.global.pubKey);
  if (!globalStateAccountInfo) {
    const receipt = await createGlobalStateCall(accounts, superUser);
  } else console.log("GLOBAL STATE ALREADY CREATED", globalStateAccountInfo);

  // check if global state exists
  const globalState: IdlAccounts<StablePool>["globalState"] =
    await programStablePool.account.globalState.fetch(accounts.global.pubKey);
  console.log("global state account: ", globalState);

  // add to the account state
  accounts.global.state = globalState;

  // testing if each of the global state's parameters exists
  assert(
    globalState.authority.toBase58() == superUser.wallet.publicKey.toBase58(),
    "\n auth is not user.super"
  );
  assert(
    accounts.global.state.mintUsdx.toBase58() ==
      accounts.mintUsdx.pubKey.toBase58(),
    "\n USDx mint is not correct"
  );
  assert(
    globalState.tvlLimit.toNumber() == constants.TVL_LIMIT,
    `Global-state TVL Limit: ${globalState.tvlLimit} \nTVL Limit: ${constants.TVL_LIMIT}`
  );
  assert(globalState.tvl.toNumber() == 0, "Err: Global-state.tvl != 0");
  assert(
    globalState.totalDebt.toNumber() == 0,
    "Err: Global-state-total-debt != 0"
  );
  assert(
    globalState.debtCeiling.toNumber() == constants.GLOBAL_DEBT_CEILING,
    `GlobalState Debt Ceiling: ${globalState.debtCeiling} Debt Ceiling: ${constants.GLOBAL_DEBT_CEILING}`
  );
};
