# DigiArogya Smart Contract Deployment Guide

## Prerequisites

1. **Node.js and npm** installed
2. **Truffle** installed globally: `npm install -g truffle`
3. **Ganache** installed for local development
4. **MetaMask** browser extension installed

## Quick Setup for Local Development

### Step 1: Start Ganache
1. Download and install [Ganache](https://trufflesuite.com/ganache/)
2. Create a new workspace or quickstart
3. Set the port to `7545` (default)
4. Make sure the network ID is set to `*` or `5777`

### Step 2: Deploy Smart Contract

```bash
# Navigate to contract directory
cd contract

# Compile the contracts
truffle compile

# Deploy to local network
truffle migrate --reset --network development
```

### Step 3: Get Contract Address
After successful deployment, you'll see output like:
```
2_deploy_contracts.js
=====================

   Deploying 'EHRmain'
   -------------------
   > transaction hash:    0x...
   > Blocks: 0            Seconds: 0
   > contract address:    0x1234567890123456789012345678901234567890
   > block number:        2
   > block timestamp:     1692123456
   > account:             0x...
   > balance:             99.99
   > gas used:            2000000
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.04 ETH
```

**Copy the contract address** (e.g., `0x1234567890123456789012345678901234567890`)

### Step 4: Configure Environment Variables

1. Create `.env` file in the root directory:
```bash
cp .env.example .env
```

2. Edit `.env` file and update:
```env
REACT_APP_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
REACT_APP_NETWORK_ID=5777
REACT_APP_DEV_MODE=false
```

### Step 5: Configure MetaMask

1. Open MetaMask
2. Click on Network dropdown → Add Network → Add a network manually
3. Add Ganache network:
   - **Network Name**: Ganache Local
   - **New RPC URL**: http://127.0.0.1:7545
   - **Chain ID**: 1337 (or as shown in Ganache)
   - **Currency Symbol**: ETH
4. Import an account from Ganache using private key

### Step 6: Start the Application

```bash
# Install dependencies (if not done already)
npm install

# Start the React application
npm start
```

## Deployment to Testnet (Sepolia)

### Step 1: Get Test ETH
1. Go to [Sepolia Faucet](https://sepoliafaucet.com/)
2. Request test ETH for your MetaMask account

### Step 2: Configure Truffle for Sepolia
1. Install HD Wallet Provider:
```bash
npm install @truffle/hdwallet-provider dotenv
```

2. Update `truffle-config.js` (uncomment and configure Sepolia network):
```javascript
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const { MNEMONIC, INFURA_PROJECT_ID } = process.env;

module.exports = {
  networks: {
    // ... existing networks
    sepolia: {
      provider: () => new HDWalletProvider(MNEMONIC, `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`),
      network_id: 11155111,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  }
  // ... rest of config
};
```

3. Create `.env` in contract directory:
```env
MNEMONIC="your twelve word mnemonic from MetaMask"
INFURA_PROJECT_ID="your_infura_project_id"
```

### Step 3: Deploy to Sepolia
```bash
cd contract
truffle migrate --network sepolia
```

### Step 4: Update React App Configuration
Update your main `.env` file:
```env
REACT_APP_CONTRACT_ADDRESS=0xYourSepoliaContractAddress
REACT_APP_NETWORK_ID=11155111
REACT_APP_DEV_MODE=false
```

## Troubleshooting

### Common Issues and Solutions

1. **"Contract not deployed" error**
   - Ensure Ganache is running
   - Check contract address in `.env`
   - Verify network ID matches

2. **MetaMask connection issues**
   - Ensure MetaMask is connected to correct network
   - Check account has sufficient ETH
   - Try refreshing the page

3. **Transaction failures**
   - Increase gas limit in truffle-config.js
   - Check account balance
   - Verify contract functions exist

4. **"Module not found" errors**
   - Run `npm install` in both root and contract directories
   - Clear node_modules and reinstall if needed

## Contract Functions Available

The smart contract includes these insurance-related functions:

- `addInsuranceClaim(patient, plan, amount, description, ipfsHash)` - Submit a new insurance claim
- `processInsuranceClaim(claimId, approve)` - Approve or reject a claim
- `getAllInsuranceClaims()` - Get all insurance claims (for insurance dashboard)
- `getInsuranceClaims(patient)` - Get claims for a specific patient

## Testing the Application

1. **Connect MetaMask** to your local Ganache network
2. **Register as a Patient** using the registration form
3. **Submit an Insurance Claim** with test data
4. **Switch to Insurance Dashboard** to approve/reject claims
5. **View Updated Status** in patient dashboard

## Production Deployment

For production deployment to Ethereum mainnet:

1. Use a hardware wallet or secure key management
2. Deploy to mainnet using Infura or Alchemy
3. Update environment variables for production
4. Enable additional security measures
5. Conduct thorough testing on testnet first

## Security Considerations

1. **Never commit private keys or mnemonics to git**
2. **Use environment variables for sensitive data**
3. **Test thoroughly on testnets before mainnet**
4. **Consider gas optimization for production**
5. **Implement proper access controls**

## Need Help?

If you encounter issues:
1. Check Ganache logs for transaction details
2. Use browser developer tools to see console errors
3. Verify contract ABI matches deployed contract
4. Check MetaMask for pending transactions
