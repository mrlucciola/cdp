import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { CDP } from '../target/types/ratio';

describe('ratio', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.CDP as Program<Ratio>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
