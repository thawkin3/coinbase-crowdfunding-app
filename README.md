# Coinbase Crowdfunding App

A simple crowdfunding app using the Coinbase Wallet SDK

## Initial Setup (Required For You To Follow If You're Trying to Run This App)

1. Create an [Infura](http://infura.io/) account if you don't already have one.
2. [Create a new Ethereum project](https://infura.io/create-project) in your Infura account. (For the "product" I used "Ethereum", and for the "project name" I used "Coinbase Crowdfunding App".)
3. When viewing your new Ethereum project, find the Endpoints section, choose the Ropsten testnet, and then copy the first URL there.
4. Create an `.env` file in this repo.
5. Add a new environment variable to the `.env` file. Give it the name `REACT_APP_INFURA_RPC_URL`. The value will be your URL you copied from your Ethereum project in the Infura dashboard.

## Running the App Locally

1. `npm install` to install dependencies
2. `npm start` to start the app locally on http://localhost:3000/

## Using the App

1. Click the "Connect" button to connect your wallet to the app. This could be something like a Coinbase or MetaMask wallet.
2. Once your wallet is connected, update the value in the number input to set your donation amount. The values are in WEI, the smallest denomination of ETH. (We’ve set a minimum donation amount of 0.01 ether and a fund goal of 10 ether in the smart contract, but those values are arbitrary.)
3. Click the "Donate" button to initiate the transaction. This will cause your wallet browser extension to pop up so that you can confirm or reject the transaction.
4. Click the "See Total Contribution Amount" button to see how much everyone has collectively contributed so far.
5. Click the "Request Refund" button after making a donation if you would like to cancel your donation.
6. Click the "Reset Connection" button if you would like to disconnect your wallet from the app and start over.

## Additional Info On How the Smart Contract Was Set Up and Deployed (No Action Required From You)

1. Open [remix.ethereum.org](remix.ethereum.org) to use the Remix IDE
2. In the `contracts` directory, create a new file called `Crowdfunding.sol`
3. Copy and paste the smart contract code into the `Crowdfunding.sol` file (see code block at the bottom of this README)
4. Change the value of `destinationWallet` to be the address of your wallet where you want funds to be sent
5. Navigate to the "Solidity compiler" tab
6. Change the compiler version to `0.8.13+commit.abaa5c0e`
7. Click the "Compile Crowdfunding.sol" button
8. Navigate to the "Deploy & run transactions" tab
9. Switch the Environment to "Injected Web3"
10. Open up Coinbase, MetaMask, or whichever wallet you want to deploy with that has Ropsten ETH and switch to the Ropsten Network
11. Back in the Remix IDE, underneath the Environment it should now say you are connected to the Ropsten Network
12. Click the "Deploy" button
13. Your wallet extension should pop up asking you to approve the transaction
14. If the transaction is approved and the contract deploys successfully, there will be a new item at the bottom of the "Deploy & run transactions" tab with the name of your contract and the contract address it was deployed to right next to it. Copy that address and paste it in the `App.js` file in this repo to replace the value of the `CROWDFUNDING_CONTRACT_ADDRESS` variable.
15. Back in the Remix IDE, navigate to the Solidity Compiler tab and scroll to the very bottom. There is a little button that lets you copy the contract's ABI. Copy it and save it to a `Crowdfunding.json` file in this repo's `src/contracts` directory.

## Crowdfunding.sol Smart Contract

```sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

/*********************************/
/*    Learning Purposes ONLY     */
/*   DO NOT USE IN PRODUCTION    */
/*********************************/

contract Crowdfunding {
    uint256 fundGoal = 10 ether;
    uint256 minContribution = 0.01 ether;

    address payable destinationWallet = payable(0x733B9052fB62C40B344584B20280F6FCcA3D628e);

    mapping(address => uint256) addressContributions;

    function donate() public payable {
        require(msg.value >= minContribution, "Donate Error: Did not meet minimum contribution");
        addressContributions[msg.sender] = msg.value;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public {
        require(address(this).balance >= fundGoal, "Withdraw Error: Did not meet contribution goal");
        destinationWallet.transfer(address(this).balance);
    }

    function returnFunds() public {
        require(address(this).balance < fundGoal, "ReturnFunds Error: Cannot refund, goal has been met");
        require(addressContributions[msg.sender] != 0, "ReturnFunds Error: You have not contributed");
        uint256 amount = addressContributions[msg.sender];
        payable(msg.sender).transfer(amount);
    }

    // Need to have a fallback function for the contract to be able to receive funds
    receive() external payable {}
}
```
