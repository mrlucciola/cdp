import * as anchor from '@project-serum/anchor';
import { StablePool } from '../target/types/stable_pool';

describe('ratio', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.StablePool as anchor.Program<StablePool>;

  it('Is initialized!', async () => {
    // Add your test here.
  });

  it('Create Global State', async () => {

  });

  it('Create Token Vault', async () => {

  });

  it('Deposit Collateral', async () => {

  });

  it('Withdraw Collateral', async () => {

  });

  it('Borrow USD', async () => {

  });

  it('Repay USD', async () => {

  });

});
