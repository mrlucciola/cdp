import React, { useState } from 'react';
import * as anchor from '@project-serum/anchor';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { borrowUSDx, createGlobalState, createTokenVault, createUserTrove, depositCollateral, repayCollateral, repayUSDx, withdrawCollateral } from '../actions';
import { Button } from '@material-ui/core';
const connection = new anchor.web3.Connection('https://api.devnet.solana.com');

const PageHome : React.FC = () => {
  const wallet:WalletContextState = useWallet();
  const [dispInfo, setDispInfo] = useState('transaction result:');

  async function createGlobalState() {
    if(wallet.connected){
      const demoLog = await createGlobalState(connection, wallet);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function createTokenVault() {
    if(wallet.connected){
      const demoLog = await createTokenVault(connection, wallet);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function createUserTrove() {
    if(wallet.connected){
      const demoLog = await createUserTrove(connection, wallet);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function depositCollateral() {
    if(wallet.connected){
      const demoLog = await depositCollateral(connection, wallet, 1 * 1000000000);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function repayCollateral() {
    if(wallet.connected){
      const demoLog = await repayCollateral(connection, wallet, 0.2 * 1000000000);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function withdrawCollateral() {
    if(wallet.connected){
      const demoLog = await withdrawCollateral(connection, wallet, 1 * 1000000000);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function borrowUSDx() {
    if(wallet.connected){
      const demoLog = await borrowUSDx(connection, wallet, 50 * 1000000);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  async function repayUSDx() {
    if(wallet.connected){
      const demoLog = await repayUSDx(connection, wallet,  20 * 1000000);
      setDispInfo(demoLog);
    }
    else{     setDispInfo("connect your wallet");    }
  }
  
  return (
    <div
    >
    <br />
    <br />
    <Button size="medium" color="primary" variant="outlined" onClick={e => createGlobalState()}>
      Create Program State
    </Button>
    <Button size="medium" color="primary" variant="outlined" onClick={e => createTokenVault()}>
      Create SOL-STEP Pool
    </Button>
    <Button size="medium" color="primary" variant="outlined" onClick={e => createUserTrove()}>
      Create SOL-STEP User Account
    </Button>
    <br />
    <br />
    <Button size="medium" color="primary" variant="outlined" onClick={e => depositCollateral()}>
      Deposit SOL-STEP
    </Button>
    <Button size="medium" color="primary" variant="outlined" onClick={e => repayCollateral()}>
      Repay SOL-STEP
    </Button>
    <Button size="medium" color="primary" variant="outlined" onClick={e => withdrawCollateral()}>
      Withdraw SOL-STEP
    </Button>
    <br />
    <br />
    <Button size="medium" color="primary" variant="outlined" onClick={e => borrowUSDx()}>
      Borrow USDx
    </Button>
    <Button size="medium" color="primary" variant="outlined" onClick={e => repayUSDx()}>
      Repay USDx with debt
    </Button>
    <br />
    <br />
    {dispInfo}
    </div>

  );
};
  
export default PageHome;