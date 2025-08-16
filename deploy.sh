#!/bin/bash

# DigiArogya Smart Contract Deployment Script
# This script automates the deployment of the EHR smart contract

set -e  # Exit on any error

echo "🏥 DigiArogya Smart Contract Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the DigiArogya project root."
    exit 1
fi

# Check if contract directory exists
if [ ! -d "contract" ]; then
    print_error "contract directory not found."
    exit 1
fi

print_status "Checking prerequisites..."

# Check if Truffle is installed
if ! command -v truffle &> /dev/null; then
    print_error "Truffle is not installed. Please install with: npm install -g truffle"
    exit 1
fi

print_success "Truffle is installed"

# Navigate to contract directory
cd contract

print_status "Compiling smart contracts..."

# Compile contracts
if truffle compile; then
    print_success "Smart contracts compiled successfully"
else
    print_error "Contract compilation failed"
    exit 1
fi

print_status "Deploying to local development network..."
print_warning "Make sure Ganache is running on port 7545"

# Deploy contracts
if truffle migrate --reset --network development; then
    print_success "Smart contracts deployed successfully"
else
    print_error "Contract deployment failed"
    exit 1
fi

print_status "Extracting contract address..."

# Extract contract address from deployment output
# This will create a simple script to get the deployed address
cat > get_contract_address.js << 'EOF'
const EHRmain = artifacts.require("EHRmain");

module.exports = async function(callback) {
  try {
    const instance = await EHRmain.deployed();
    console.log("Contract Address:", instance.address);
    callback();
  } catch (error) {
    console.error("Error:", error);
    callback(error);
  }
};
EOF

# Get the contract address
CONTRACT_ADDRESS=$(truffle exec get_contract_address.js --network development | grep "Contract Address:" | cut -d' ' -f3)

if [ -z "$CONTRACT_ADDRESS" ]; then
    print_error "Could not extract contract address"
    exit 1
fi

print_success "Contract deployed at address: $CONTRACT_ADDRESS"

# Navigate back to root
cd ..

# Update or create .env file
print_status "Updating environment configuration..."

# Check if .env exists, if not create from example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "Created .env from .env.example"
    else
        # Create basic .env file
        cat > .env << EOF
# Environment Variables for DigiArogya DApp
REACT_APP_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
REACT_APP_NETWORK_ID=5777
REACT_APP_DEV_MODE=false
EOF
        print_status "Created new .env file"
    fi
fi

# Update contract address in .env file
if command -v sed &> /dev/null; then
    # Use sed to update the contract address
    sed -i.bak "s/REACT_APP_CONTRACT_ADDRESS=.*/REACT_APP_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env
    rm -f .env.bak
    print_success "Updated contract address in .env file"
else
    print_warning "sed not available. Please manually update REACT_APP_CONTRACT_ADDRESS in .env file"
    print_warning "Set: REACT_APP_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
fi

print_status "Installation summary:"
echo "========================"
echo "✅ Smart contracts compiled"
echo "✅ Contracts deployed to local network"
echo "✅ Contract address: $CONTRACT_ADDRESS"
echo "✅ Environment configured"
echo ""
print_success "Deployment completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Make sure Ganache is running on port 7545"
echo "2. Configure MetaMask to connect to Ganache network"
echo "3. Import a Ganache account into MetaMask"
echo "4. Run 'npm start' to start the application"
echo ""
print_status "For detailed setup instructions, see DEPLOYMENT_GUIDE.md"

# Clean up temporary files
cd contract
rm -f get_contract_address.js

print_success "Setup completed! 🎉"
