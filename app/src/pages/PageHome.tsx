import React, { useState } from 'react';
import * as anchor from '@project-serum/anchor';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { borrowUSDx, createGlobalState, createTokenVault, createUserTrove, depositCollateral,  repayUSDx, LP1_MINT_KEY, withdrawCollateral } from '../actions';
import { Button } from '@material-ui/core';
const connection = new anchor.web3.Connection('https://api.devnet.solana.com');

const PageHome : React.FC = () => {
  const wallet:WalletContextState = useWallet();
  const [dispInfo, setDispInfo] = useState('transaction result:');

  async function createGlobalStateUI() {
    if(wallet.connected){
      const demoLog = await createGlobalState(connection, wallet);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function createTokenVaultUI() {
    if(wallet.connected){
      const demoLog = await createTokenVault(connection, wallet, LP1_MINT_KEY);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function createUserTroveUI() {
    if(wallet.connected){
      const demoLog = await createUserTrove(connection, wallet, LP1_MINT_KEY);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function depositCollateralUI() {
    if(wallet.connected){
      const demoLog = await depositCollateral(connection, wallet, 10 * 1000000000, "26D286dDWqMubB1XPedmUwWz7P7CdqtYzLhLWv37edKR", LP1_MINT_KEY);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function withdrawCollateralUI() {
    if(wallet.connected){
      const demoLog = await withdrawCollateral(connection, wallet, 3 * 1000000000, "26D286dDWqMubB1XPedmUwWz7P7CdqtYzLhLWv37edKR", LP1_MINT_KEY);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function borrowUSDxUI() {
    if(wallet.connected){
      const demoLog = await borrowUSDx(connection, wallet, 50 * 1000000, LP1_MINT_KEY);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function repayUSDxUI() {
    if(wallet.connected){
      const demoLog = await repayUSDx(connection, wallet,  20 * 1000000, LP1_MINT_KEY);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  
  return (
    <div
    >
    <br />
    <br />
    <Button size="medium" color="primary" variant="outlined" onClick={e => createGlobalStateUI()}>
      Create Program State
    </Button>
    <Button size="medium" color="primary" variant="outlined" onClick={e => createTokenVaultUI()}>
      Create SOL-STEP Pool
    </Button>
    <Button size="medium" color="primary" variant="outlined" onClick={e => createUserTroveUI()}>
      Create SOL-STEP User Account
    </Button>
    <br />
    <br />
    <Button size="medium" color="primary" variant="outlined" onClick={e => depositCollateralUI()}>
      Deposit SOL-STEP
    </Button>
    <Button size="medium" color="primary" variant="outlined" onClick={e => withdrawCollateralUI()}>
      Withdraw SOL-STEP
    </Button>
    <br />
    <br />
    <Button size="medium" color="primary" variant="outlined" onClick={e => borrowUSDxUI()}>
      Borrow USDx
    </Button>
    <Button size="medium" color="primary" variant="outlined" onClick={e => repayUSDxUI()}>
      Repay USDx with debt
    </Button>
    <br />
    <br />
    <textarea value={dispInfo}></textarea>
    </div>

  );
};
  
export default PageHome;