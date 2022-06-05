import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import Contract from 'web3-eth-contract';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import CrowdfundingContract from './contracts/Crowdfunding.json';
import elon from './elon.jpg';
import './App.css';

const APP_NAME = 'Coinbase Crowdfunding App';
const APP_LOGO_URL = './elon.jpg';
const RPC_URL = process.env.REACT_APP_INFURA_RPC_URL;
const CHAIN_ID = 3; // Ropsten Network ID
const CROWDFUNDING_CONTRACT_ADDRESS =
  '0x6CE498a35a39Cb43c08B81e7A06f2bb09741359d';

const App = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [account, setAccount] = useState();
  const [walletSDKProvider, setWalletSDKProvider] = useState();
  const [web3, setWeb3] = useState();
  const [crowdfundingContractInstance, setCrowdfundingContractInstance] =
    useState();
  const [responseMessage, setResponseMessage] = useState();

  useEffect(() => {
    // Initialize Coinbase Wallet SDK
    const coinbaseWallet = new CoinbaseWalletSDK({
      appName: APP_NAME,
      appLogoUrl: APP_LOGO_URL,
    });

    // Initialize Web3 Provider
    const walletSDKProvider = coinbaseWallet.makeWeb3Provider(
      RPC_URL,
      CHAIN_ID
    );
    setWalletSDKProvider(walletSDKProvider);

    // Initialize Web3 object
    const web3 = new Web3(walletSDKProvider);
    setWeb3(web3);

    // TODO: I think the problem lies in how I'm using the setProvider method
    // Initialize crowdfunding contract
    Contract.setProvider(walletSDKProvider);
    const crowdfundingContractInstance = new Contract(
      CrowdfundingContract,
      CROWDFUNDING_CONTRACT_ADDRESS
    );
    setCrowdfundingContractInstance(crowdfundingContractInstance);
  }, []);

  const checkIfWalletIsConnected = () => {
    if (!window.ethereum) {
      console.log(
        'No ethereum object found. Please install Coinbase Wallet extension or similar.'
      );

      // Enable the provider and cause the Coinbase Onboarding UI to pop up
      web3.setProvider(walletSDKProvider.enable());

      return;
    }

    console.log('Found the ethereum object:', window.ethereum);
    connectWallet();
  };

  const connectWallet = async () => {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts.length) {
      console.log('No authorized account found');
      return;
    }

    if (accounts.length) {
      const account = accounts[0];
      console.log('Found an authorized account:', account);
      setAccount(account);

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x3' }],
        });
        console.log('Successfully switched to Ropsten Network');
      } catch (error) {
        console.error(error);
      }
    }

    setIsWalletConnected(true);
  };

  const donateETH = async () => {
    if (!account || !window.ethereum) {
      console.log('Wallet is not connected');
      return;
    }

    const donationAmount = document.querySelector('#donationAmount').value;

    // TODO: This is getting the following error:
    // "Error: The requested account and/or method has not been authorized by the user."
    const response = await crowdfundingContractInstance.methods.donate().send({
      from: account,
      value: donationAmount,
    });
    setResponseMessage(
      `Thank you for donating! Here's your receipt: ${response}`
    );
  };

  // NOTE: This works just fine. I assume that's because it's a static method
  // on the smart contract that doesn't modify the smart contract's state (`call` vs. `send`).
  const getDonationBalance = async () => {
    const response = await crowdfundingContractInstance.methods
      .getBalance()
      .call();
    setResponseMessage(
      `Total contribution amount is ${web3.utils.fromWei(response)} ETH.`
    );
  };

  // TODO: This is getting the following error:
  // "Error: The requested account and/or method has not been authorized by the user."const requestRefund = async () => {
  const requestRefund = async () => {
    await crowdfundingContractInstance.methods
      .returnFunds()
      .send({ from: account });
    setResponseMessage('Your donation has been refunded.');
  };

  const resetCoinbaseWalletConnection = () => {
    walletSDKProvider.close();
  };

  return (
    <main className="app">
      <header>
        <img
          src={elon}
          className="headerImage"
          alt="Elon holding the Twitter logo"
        />
        <h1>Let's buy Twitter before Elon does!</h1>
      </header>

      {isWalletConnected ? (
        <>
          <p>Connected Account: {account}</p>
          <div>
            <input type="number" id="donationAmount" defaultValue={10000} />
            <label htmlFor="donationAmount">WEI</label>
            <button onClick={donateETH} id="donate" type="button">
              Donate
            </button>
          </div>
          <div>
            <button
              id="getDonationBalance"
              type="button"
              onClick={getDonationBalance}
            >
              See Total Contribution Amount
            </button>
          </div>
          <div>
            <button id="requestRefund" type="button" onClick={requestRefund}>
              Request Refund
            </button>
          </div>
          <div>
            <button
              id="reset"
              type="button"
              onClick={resetCoinbaseWalletConnection}
            >
              Reset Connection
            </button>
          </div>
        </>
      ) : (
        <button onClick={checkIfWalletIsConnected} id="connect" type="button">
          Connect Wallet
        </button>
      )}
      <p>{responseMessage}</p>
    </main>
  );
};

export default App;
