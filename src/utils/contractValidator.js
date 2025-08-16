import { ethers } from 'ethers';
import contractABI from '../contractABI.json';

/**
 * Contract Setup Validator
 * Quick checks to ensure your contract is properly deployed and accessible
 */
export async function validateContractSetup() {
  console.log('\n🏥 CONTRACT SETUP VALIDATION');
  console.log('='.repeat(40));
  
  try {
    // Check if we have provider
    if (!window.ethereum) {
      console.error('❌ MetaMask not detected');
      return false;
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    console.log('✅ Provider connected');
    
    // Check network
    const network = await provider.getNetwork();
    console.log('📡 Network:', network.name, '(Chain ID:', network.chainId, ')');
    
    // Check accounts
    const accounts = await provider.listAccounts();
    console.log('👤 Connected accounts:', accounts.length);
    if (accounts.length > 0) {
      console.log('📍 Active account:', accounts[0].address);
    }
    
    // Check contract
    const contractAddress = contractABI.networks?.[network.chainId]?.address;
    if (!contractAddress) {
      console.error('❌ No contract address found for this network');
      console.log('Available networks:', Object.keys(contractABI.networks || {}));
      return false;
    }
    
    console.log('📋 Contract address:', contractAddress);
    
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.error('❌ No contract deployed at this address');
      return false;
    }
    
    console.log('✅ Contract deployed successfully');
    console.log('📄 Contract bytecode length:', code.length, 'characters');
    
    // Try to create contract instance
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
    
    // Test a simple read function
    try {
      // Try to call a view function to test contract interaction
      console.log('\n🔍 Testing contract interaction...');
      
      // Check if contract has the expected functions
      const hasInsuranceFunctions = contract.interface.hasFunction('addInsuranceClaim') &&
                                   contract.interface.hasFunction('getInsuranceClaims') &&
                                   contract.interface.hasFunction('processInsuranceClaim');
      
      if (hasInsuranceFunctions) {
        console.log('✅ Insurance claim functions found');
      } else {
        console.log('⚠️ Some insurance functions missing');
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Contract interaction failed:', error.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

/**
 * Quick contract function tester
 */
export async function testContractFunction(functionName, args = []) {
  try {
    console.log(`\n🧪 TESTING FUNCTION: ${functionName}`);
    console.log('='.repeat(30));
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const contractAddress = contractABI.networks?.[network.chainId]?.address;
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
    
    console.log('Arguments:', args);
    
    // First try static call
    const staticResult = await contract[functionName].staticCall(...args);
    console.log('✅ Static call succeeded:', staticResult);
    
    // Estimate gas
    const gasEstimate = await contract[functionName].estimateGas(...args);
    console.log('⛽ Gas estimate:', gasEstimate.toString());
    
    return {
      success: true,
      staticResult,
      gasEstimate
    };
    
  } catch (error) {
    console.error('❌ Function test failed:', error.message);
    console.error('Error details:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get contract info
 */
export async function getContractInfo() {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const contractAddress = contractABI.networks?.[network.chainId]?.address;
    
    if (!contractAddress) {
      return null;
    }
    
    const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);
    
    // Get all function names
    const functions = Object.keys(contract.interface.functions);
    const events = Object.keys(contract.interface.events);
    
    console.log('\n📋 CONTRACT INFO');
    console.log('='.repeat(20));
    console.log('Address:', contractAddress);
    console.log('Network:', network.name);
    console.log('Functions:', functions.length);
    console.log('Events:', events.length);
    
    console.log('\n📝 Available Functions:');
    functions.forEach(func => {
      const fragment = contract.interface.getFunction(func);
      console.log(`  ${fragment.format()}`);
    });
    
    console.log('\n📢 Available Events:');
    events.forEach(event => {
      const fragment = contract.interface.getEvent(event);
      console.log(`  ${fragment.format()}`);
    });
    
    return {
      address: contractAddress,
      network: network.name,
      functions,
      events
    };
    
  } catch (error) {
    console.error('Failed to get contract info:', error.message);
    return null;
  }
}

// Make available in console
if (typeof window !== 'undefined') {
  window.validateContract = validateContractSetup;
  window.testFunction = testContractFunction;
  window.getContractInfo = getContractInfo;
}

const contractValidator = {
  validateContractSetup,
  testContractFunction,
  getContractInfo
};

export default contractValidator;
