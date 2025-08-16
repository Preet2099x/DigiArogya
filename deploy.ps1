# DigiArogya Smart Contract Deployment Script (PowerShell)
# This script automates the deployment of the EHR smart contract on Windows

param(
    [switch]$TestNet,
    [string]$Network = "development"
)

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Host "🏥 DigiArogya Smart Contract Deployment Script" -ForegroundColor Cyan
Write-Host "==============================================`n" -ForegroundColor Cyan

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Error-Custom "package.json not found. Please run this script from the DigiArogya project root."
    exit 1
}

# Check if contract directory exists
if (!(Test-Path "contract")) {
    Write-Error-Custom "contract directory not found."
    exit 1
}

Write-Status "Checking prerequisites..."

# Check if Truffle is installed
try {
    $truffleVersion = truffle version 2>$null
    Write-Success "Truffle is installed"
}
catch {
    Write-Error-Custom "Truffle is not installed. Please install with: npm install -g truffle"
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version 2>$null
    Write-Success "npm is available"
}
catch {
    Write-Error-Custom "npm is not installed. Please install Node.js and npm."
    exit 1
}

# Navigate to contract directory
Set-Location contract

Write-Status "Compiling smart contracts..."

# Compile contracts
try {
    truffle compile
    Write-Success "Smart contracts compiled successfully"
}
catch {
    Write-Error-Custom "Contract compilation failed"
    Set-Location ..
    exit 1
}

Write-Status "Deploying to $Network network..."

if ($Network -eq "development") {
    Write-Warning "Make sure Ganache is running on port 7545"
}

# Deploy contracts
try {
    truffle migrate --reset --network $Network
    Write-Success "Smart contracts deployed successfully"
}
catch {
    Write-Error-Custom "Contract deployment failed"
    Set-Location ..
    exit 1
}

Write-Status "Extracting contract address..."

# Create script to get contract address
@"
const EHRmain = artifacts.require("EHRmain");

module.exports = async function(callback) {
  try {
    const instance = await EHRmain.deployed();
    console.log("CONTRACT_ADDRESS=" + instance.address);
    callback();
  } catch (error) {
    console.error("Error:", error);
    callback(error);
  }
};
"@ | Out-File -FilePath "get_contract_address.js" -Encoding UTF8

# Get the contract address
try {
    $output = truffle exec get_contract_address.js --network $Network 2>&1
    $contractAddressLine = $output | Where-Object { $_ -match "CONTRACT_ADDRESS=" }
    $contractAddress = ($contractAddressLine -split "=")[1]
    
    if ($contractAddress) {
        Write-Success "Contract deployed at address: $contractAddress"
    } else {
        Write-Error-Custom "Could not extract contract address"
        Set-Location ..
        exit 1
    }
}
catch {
    Write-Error-Custom "Failed to get contract address"
    Set-Location ..
    exit 1
}

# Navigate back to root
Set-Location ..

# Update or create .env file
Write-Status "Updating environment configuration..."

# Check if .env exists, if not create from example
if (!(Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Status "Created .env from .env.example"
    } else {
        # Create basic .env file
        $networkId = if ($Network -eq "development") { "5777" } else { "11155111" }
        @"
# Environment Variables for DigiArogya DApp
REACT_APP_CONTRACT_ADDRESS=$contractAddress
REACT_APP_NETWORK_ID=$networkId
REACT_APP_DEV_MODE=false
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Write-Status "Created new .env file"
    }
}

# Update contract address in .env file
try {
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent -replace "REACT_APP_CONTRACT_ADDRESS=.*", "REACT_APP_CONTRACT_ADDRESS=$contractAddress"
    $envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
    Write-Success "Updated contract address in .env file"
}
catch {
    Write-Warning "Could not automatically update .env file. Please manually update:"
    Write-Warning "Set: REACT_APP_CONTRACT_ADDRESS=$contractAddress"
}

Write-Status "Installation summary:"
Write-Host "========================" -ForegroundColor Cyan
Write-Host "✅ Smart contracts compiled" -ForegroundColor Green
Write-Host "✅ Contracts deployed to $Network network" -ForegroundColor Green
Write-Host "✅ Contract address: $contractAddress" -ForegroundColor Green
Write-Host "✅ Environment configured" -ForegroundColor Green
Write-Host ""

Write-Success "Deployment completed successfully!"
Write-Host ""

Write-Status "Next steps:"
if ($Network -eq "development") {
    Write-Host "1. Make sure Ganache is running on port 7545" -ForegroundColor White
    Write-Host "2. Configure MetaMask to connect to Ganache network" -ForegroundColor White
    Write-Host "3. Import a Ganache account into MetaMask" -ForegroundColor White
} else {
    Write-Host "1. Configure MetaMask to connect to the correct testnet" -ForegroundColor White
    Write-Host "2. Ensure you have test ETH in your account" -ForegroundColor White
}
Write-Host "4. Run 'npm start' to start the application" -ForegroundColor White
Write-Host ""
Write-Status "For detailed setup instructions, see DEPLOYMENT_GUIDE.md"

# Clean up temporary files
Remove-Item "contract\get_contract_address.js" -ErrorAction SilentlyContinue

Write-Success "Setup completed! 🎉"

Write-Host "`nContract Address: $contractAddress" -ForegroundColor Yellow
Write-Host "Network: $Network" -ForegroundColor Yellow
Write-Host "`nYou can now run 'npm start' to launch the application!" -ForegroundColor Cyan
