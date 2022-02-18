// anchor imports
import {
  Provider,
  Program,
  web3,
  // @ts-ignore
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
import { Users } from "../config/users";
import { Accounts } from "../config/accounts";
import { StablePool } from "../../target/types/stable_pool";

const programStablePool = workspace.StablePool as Program<StablePool>;

export const createGlobalState = async (
  provider: Provider,
  accounts: Accounts,
  users: Users
) => {
  // check if global state exists. If not, create it
  const isNullGlobalState: web3.AccountInfo<Buffer> =
    await provider.connection.getAccountInfo(accounts.global.pubKey);

  // create the global state account
  console.log(
    "mint",
    accounts.mintUsd.pubKey,
    "\n",
    accounts.mintUsd.pubKey.toString()
  );
  if (!isNullGlobalState) {
    const txnCreateGlobalState = new web3.Transaction().add(
      programStablePool.instruction.createGlobalState(
        accounts.global.bump, // prev: globalStateNonce
        accounts.mintUsd.bump, // prev: mintUsdNonce
        new BN(constants.TVL_LIMIT),
        new BN(constants.GLOBAL_DEBT_CEILING),
        {
          accounts: {
            authority: users.super.wallet.publicKey,
            globalState: accounts.global.pubKey,
            mintUsd: accounts.mintUsd.pubKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [users.super.wallet.payer],
        }
      )
    );

    const confirmation = await handleTxn(
      txnCreateGlobalState,
      provider,
      users.super.wallet // users.super.wallet
    );
    console.log("Global state creation confirmed: ", confirmation);
  } else
    console.log("ALREADY CREATED accounts.global.pubKey =", isNullGlobalState);

  // check if global state exists
  const globalState: IdlAccounts<StablePool>["globalState"] =
    await programStablePool.account.globalState.fetch(accounts.global.pubKey);
  console.log("global state account: ", globalState);

  // add to the account state
  accounts.global.state = globalState;

  // testing if each of the global state's parameters exists
  assert(
    globalState.authority.toBase58() == users.super.wallet.publicKey.toBase58(),
    "\n auth is not user.super"
  );
  assert(
    accounts.global.state.mintUsd.toBase58() ==
      accounts.mintUsd.pubKey.toBase58(),
    "\n USD mint is not correct"
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
