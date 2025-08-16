const fs = require('fs');

console.log('🏥 DigiArogya Setup Verification');
console.log('================================\n');

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

function checkStatus(item, status, details = '') {
    const symbol = status ? '✅' : '❌';
    const color = status ? colors.green : colors.red;
    console.log(`${symbol} ${color}${item}${colors.reset}${details ? ` - ${details}` : ''}`);
}

function checkWarning(item, details = '') {
    console.log(`⚠️  ${colors.yellow}${item}${colors.reset}${details ? ` - ${details}` : ''}`);
}

function checkInfo(item, details = '') {
    console.log(`ℹ️  ${colors.blue}${item}${colors.reset}${details ? ` - ${details}` : ''}`);
}

// Check if we're in the right directory
const isInProjectRoot = fs.existsSync('package.json') && fs.existsSync('src');
checkStatus('Project directory', isInProjectRoot, isInProjectRoot ? 'Located in DigiArogya project root' : 'Not in project root directory');

// Check package.json
if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    checkStatus('Package.json', true, `Project: ${packageJson.name}`);
} else {
    checkStatus('Package.json', false, 'File not found');
}

// Check contract directory and files
const contractExists = fs.existsSync('contract');
checkStatus('Contract directory', contractExists);

if (contractExists) {
    const truffleConfigExists = fs.existsSync('contract/truffle-config.js');
    checkStatus('Truffle configuration', truffleConfigExists);
    
    const migrationExists = fs.existsSync('contract/migrations/1_ehrmain.js');
    checkStatus('Migration file', migrationExists);
    
    const solidityExists = fs.existsSync('contract/contracts/EHRmain.sol');
    checkStatus('Smart contract', solidityExists);
    
    const buildExists = fs.existsSync('contract/build/contracts/EHRmain.json');
    checkStatus('Compiled contract', buildExists, buildExists ? 'Contract has been compiled' : 'Run truffle compile');
}

// Check service files
const servicesExist = fs.existsSync('src/services/transactions/insuranceClaimProcessing.js') && 
                     fs.existsSync('src/services/transactions/insuranceClaimSubmit.js');
checkStatus('Insurance service files', servicesExist, servicesExist ? 'All required services available' : 'Service files missing');

// Check environment configuration
const envExists = fs.existsSync('.env');
if (envExists) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const hasContractAddress = envContent.includes('REACT_APP_CONTRACT_ADDRESS=') && 
                             !envContent.includes('YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE');
    checkStatus('Environment file', true, '.env file exists');
    checkStatus('Contract address configured', hasContractAddress, 
               hasContractAddress ? 'Contract address is set' : 'Update REACT_APP_CONTRACT_ADDRESS');
} else {
    checkStatus('Environment file', false, 'Create .env file from .env.example');
}

// Check node_modules
const nodeModulesExists = fs.existsSync('node_modules');
checkStatus('Dependencies installed', nodeModulesExists, nodeModulesExists ? 'npm install completed' : 'Run npm install');

console.log('\n' + colors.bright + '📋 Setup Status Summary' + colors.reset);
console.log('========================\n');

if (!isInProjectRoot) {
    checkWarning('Navigate to DigiArogya project root directory');
}

if (!nodeModulesExists) {
    checkWarning('Install dependencies', 'Run: npm install');
}

if (!contractExists) {
    checkWarning('Contract directory missing', 'Check project structure');
} else if (!fs.existsSync('contract/build/contracts/EHRmain.json')) {
    checkInfo('Compile contracts', 'Run: cd contract && truffle compile');
}

if (!envExists) {
    checkInfo('Create environment file', 'Copy .env.example to .env');
} else {
    const envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE')) {
        checkWarning('Deploy contract and update .env', 'Run deployment script or manually deploy');
    }
}

console.log('\n' + colors.bright + '🚀 Quick Start Commands' + colors.reset);
console.log('======================\n');

console.log('1. Install dependencies:');
console.log(colors.blue + '   npm install' + colors.reset + '\n');

console.log('2. Deploy smart contract (Local Development):');
console.log(colors.blue + '   # Start Ganache first, then run:' + colors.reset);
console.log(colors.blue + '   # Windows PowerShell:' + colors.reset);
console.log(colors.blue + '   .\\deploy.ps1' + colors.reset);
console.log(colors.blue + '   # Unix/Linux/Mac:' + colors.reset);
console.log(colors.blue + '   ./deploy.sh' + colors.reset + '\n');

console.log('3. Start the application:');
console.log(colors.blue + '   npm start' + colors.reset + '\n');

console.log(colors.green + '📖 For detailed instructions, see DEPLOYMENT_GUIDE.md' + colors.reset);

// Check if this is a fresh installation
const isDevMode = !envExists || fs.readFileSync('.env', 'utf8').includes('YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE');
if (isDevMode) {
    console.log('\n' + colors.yellow + '⚡ You\'re in DEMO MODE' + colors.reset);
    console.log('The application will use local storage for testing until you deploy the smart contract.');
    console.log('Follow the deployment guide to enable full blockchain functionality.');
}
