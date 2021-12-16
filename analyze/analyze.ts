import * as anchor from '@project-serum/anchor';
import { StablePool } from '../target/types/stable_pool';
import { StablePoolFaucet } from '../target/types/stable_pool_faucet';
import { analyzeFaucet, analyzePool} from './analyze-users';

anchor.setProvider(anchor.Provider.env());

const poolProgram = anchor.workspace.StablePool as anchor.Program<StablePool>;
const faucetProgram = anchor.workspace.StablePoolFaucet as anchor.Program<StablePoolFaucet>;
async function main() {
  console.log('analyzing faucet...')
  const faucetResult = await analyzeFaucet(faucetProgram.provider.connection, faucetProgram.programId);
  console.log('faucet result', faucetResult)

  console.log('analyzing pool ...')
  const poolResult = await analyzePool(poolProgram.provider.connection, poolProgram.programId);
  console.log('pool result', poolResult)
}

main()
  .then(() => console.log("Success"))
  .catch((e) => console.error(e));
