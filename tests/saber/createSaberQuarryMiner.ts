// anchor imports
import { Program, workspace } from "@project-serum/anchor";
// solana imports
import { Token as SToken } from "@saberhq/token-utils";
// utils
import { assert } from "chai";
// local
import { StablePool } from "../../target/types/stable_pool";
// import { Periphery } from "../../target/types/periphery";
import { DECIMALS_USDCUSDT } from "../utils/constants";
import { Accounts } from "../config/accounts";
import { User } from "../interfaces/user";

// const programPeriphery = workspace.Periphery as Program<Periphery>;

/**
 * Pass when attempting to make a quarry miner that doesn't exist
 */
export const createSaberQuarryMinerPASS = async (
  user: User,
  accounts: Accounts
) => {
  const minerUser = user.tokens.lpSaber.vault.miner;
  const confirmation = await minerUser.initMiner();
  console.log("created miner: ", confirmation);

  // create the SToken for collateral (usdc usdt lp) mint  prev poolMintToken
  const mintCollatSToken = SToken.fromMint(
    accounts.lpSaberUsdcUsdt.mint,
    DECIMALS_USDCUSDT
  );

  // get the miner. param is the authority
  const miner =
    await accounts.lpSaberUsdcUsdt.pool.quarry.quarryWrapper.getMiner(
      user.tokens.lpSaber.vault.pubKey
    );
  assert(
    miner.authority.equals(user.tokens.lpSaber.vault.pubKey),
    "Miner authority mismatch"
  );
};
