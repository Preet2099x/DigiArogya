import { BrowserProvider, ethers } from 'ethers';
import { getContractForFunction, CONTRACT_FALLBACK } from '../config/contracts';
import mainContractABI from '../contractABI.json';
import insuranceContractABI from '../insuranceContractABI.json';

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = new Map();
  }

  async initialize() {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    this.provider = new BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    return this.signer;
  }

  getContract(contractInfo) {
    const key = `${contractInfo.address}-${contractInfo.name}`;
    
    if (!this.contracts.has(key)) {
      const abi = contractInfo.name === 'InsuranceContract' 
        ? insuranceContractABI.abi 
        : mainContractABI.abi;
      
      const contract = new ethers.Contract(contractInfo.address, abi, this.signer);
      this.contracts.set(key, contract);
    }
    
    return this.contracts.get(key);
  }

  async callContractFunction(functionName, ...args) {
    try {
      await this.initialize();
      
      const contractInfo = getContractForFunction(functionName);
      const contract = this.getContract(contractInfo);
      
      console.log(`Calling ${functionName} on ${contractInfo.name} at ${contractInfo.address}`);
      
      if (typeof contract[functionName] !== 'function') {
        throw new Error(`Function ${functionName} not found on contract ${contractInfo.name}`);
      }
      
      try {
        const result = await contract[functionName](...args);
        console.log(`${functionName} result:`, result);
        return result;
      } catch (contractCallError) {
        // Handle specific ethers errors
        if (contractCallError.code === 'BAD_DATA' && contractCallError.value === '0x') {
          console.log(`${functionName} returned empty data - no records found`);
          return []; // Return empty array for empty results
        }
        throw contractCallError;
      }
      
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      
      // If fallback is enabled and this is an insurance function, try the insurance contract
      if (CONTRACT_FALLBACK.enableFallback && this.isInsuranceFunction(functionName)) {
        return await this.fallbackInsuranceCall(functionName, ...args);
      }
      
      throw error;
    }
  }

  async fallbackInsuranceCall(functionName, ...args) {
    console.log(`Attempting fallback for ${functionName}`);
    
    try {
      const insuranceContract = this.getContract({
        address: '0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f',
        name: 'InsuranceContract'
      });
      
      if (typeof insuranceContract[functionName] === 'function') {
        try {
          const result = await insuranceContract[functionName](...args);
          console.log(`Fallback ${functionName} successful:`, result);
          return result;
        } catch (fallbackCallError) {
          // Handle specific ethers errors in fallback too
          if (fallbackCallError.code === 'BAD_DATA' && fallbackCallError.value === '0x') {
            console.log(`Fallback ${functionName} returned empty data - no records found`);
            return []; // Return empty array for empty results
          }
          throw fallbackCallError;
        }
      } else {
        throw new Error(`Fallback function ${functionName} not available`);
      }
    } catch (fallbackError) {
      console.error(`Fallback failed for ${functionName}:`, fallbackError);
      
      // For BAD_DATA errors, just return empty array instead of throwing
      if (fallbackError.code === 'BAD_DATA') {
        console.log(`Returning empty array for BAD_DATA error in ${functionName}`);
        return [];
      }
      
      throw new Error(`Both primary and fallback calls failed for ${functionName}`);
    }
  }

  isInsuranceFunction(functionName) {
    const insuranceFunctions = [
      'getInsuranceClaims',
      'getAllInsuranceClaims', 
      'addInsuranceClaim',
      'processInsuranceClaim',
      'checkUser',
      'registerUser',
      'addSampleData'
    ];
    return insuranceFunctions.includes(functionName);
  }

  // Specific insurance methods with better error handling
  async getInsuranceClaims(patientAddress) {
    try {
      const result = await this.callContractFunction('getInsuranceClaims', patientAddress);
      return this.processClaimsData(result);
    } catch (error) {
      console.error('Failed to get insurance claims:', error);
      return []; // Return empty array as fallback
    }
  }

  async getAllInsuranceClaims() {
    try {
      const result = await this.callContractFunction('getAllInsuranceClaims');
      return this.processClaimsData(result);
    } catch (error) {
      console.error('Failed to get all insurance claims:', error);
      return []; // Return empty array as fallback
    }
  }

  async addInsuranceClaim(patient, plan, amount, description, ipfsHash) {
    try {
      // Convert amount to wei if it's a number
      const amountInWei = typeof amount === 'number' 
        ? ethers.parseEther(amount.toString()) 
        : amount;
      
      const result = await this.callContractFunction(
        'addInsuranceClaim', 
        patient, 
        plan, 
        amountInWei, 
        description, 
        ipfsHash
      );
      
      // Wait for transaction confirmation
      if (result.wait) {
        await result.wait();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to add insurance claim:', error);
      throw error;
    }
  }

  async addSampleData() {
    try {
      const result = await this.callContractFunction('addSampleData');
      
      // Wait for transaction confirmation
      if (result.wait) {
        await result.wait();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to add sample data:', error);
      throw error;
    }
  }

  async processInsuranceClaim(claimId, approve) {
    try {
      console.log(`🔄 Processing claim ${claimId}, approve: ${approve}`);
      
      // First validate inputs
      if (!claimId || claimId <= 0) {
        throw new Error('Invalid claim ID provided');
      }

      // Convert claimId to number for comparison
      const numericClaimId = parseInt(claimId);
      console.log(`📊 Numeric claim ID: ${numericClaimId}`);

      // SKIP VALIDATION FOR NOW - Let the blockchain handle it
      console.log('⚠️ Skipping frontend validation - letting blockchain validate directly');
      
      // Try the contract call directly with additional error handling
      try {
        console.log(`📞 Calling contract function with claimId=${numericClaimId}, approve=${approve}`);
        
        // Get the contract directly to bypass any fallback issues
        await this.initialize();
        const contractInfo = getContractForFunction('processInsuranceClaim');
        const contract = this.getContract(contractInfo);
        
        // Log contract details
        console.log(`📋 Contract address: ${contractInfo.address}`);
        console.log(`📋 Contract name: ${contractInfo.name}`);
        
        // Try to call the function directly
        const result = await contract.processInsuranceClaim(numericClaimId, approve);
        
        // Wait for transaction confirmation if it's a transaction
        if (result && result.wait) {
          console.log('⏳ Waiting for transaction confirmation...');
          await result.wait();
          console.log('✅ Transaction confirmed!');
        }
        
        return result;
      } catch (contractError) {
        console.error('❌ Contract call failed:', contractError);
        
        // If contract call fails, try to get more information about why
        if (contractError.message.includes('missing revert data')) {
          console.log('🔍 Investigating contract state due to missing revert data...');
          
          try {
            // Try to get contract state information
            const contractInfo = getContractForFunction('getAllInsuranceClaims');
            const contract = this.getContract(contractInfo);
            
            // Check if we can read basic contract info
            const allClaims = await contract.getAllInsuranceClaims();
            console.log(`📊 Contract readable - found ${allClaims.length} claims`);
            
            // Check if nextClaimId exists and is readable
            try {
              const nextClaimId = await contract.nextClaimId();
              console.log(`📊 Contract nextClaimId: ${nextClaimId}`);
              
              if (numericClaimId >= nextClaimId) {
                throw new Error(`Claim ID ${numericClaimId} is out of range. Next claim ID is ${nextClaimId}. Valid range: 1 to ${nextClaimId - 1}`);
              }
              
              // Check if the specific claim exists
              const targetClaim = allClaims.find(claim => {
                const claimIdStr = claim.claimId?.toString();
                return claimIdStr === numericClaimId.toString();
              });
              
              if (!targetClaim) {
                const availableIds = allClaims.map(c => c.claimId?.toString()).join(', ');
                throw new Error(`Claim ID ${numericClaimId} does not exist. Available claim IDs: ${availableIds || 'none'}`);
              }
              
              if (targetClaim.status !== 'Pending') {
                throw new Error(`Claim ID ${numericClaimId} is already ${targetClaim.status}. Only Pending claims can be processed.`);
              }
              
              // If we get here, the claim should be valid but blockchain is rejecting it
              throw new Error(`Claim ID ${numericClaimId} appears valid but blockchain rejected the transaction. This might be a gas estimation issue or the claim status changed recently.`);
              
            } catch (nextIdError) {
              console.error('❌ Could not read nextClaimId:', nextIdError);
              throw new Error('Unable to validate claim ID range due to contract read error.');
            }
            
          } catch (readError) {
            console.error('❌ Could not read contract state:', readError);
            throw new Error('Contract is not responding properly. Check if the contract is deployed and accessible.');
          }
        }
        
        throw contractError;
      }
      
    } catch (error) {
      console.error('💥 Failed to process insurance claim:', error);
      
      // Provide more specific error messages based on what we learned
      if (error.message.includes('out of range')) {
        throw error; // Keep detailed range message
      } else if (error.message.includes('does not exist')) {
        throw error; // Keep detailed existence message
      } else if (error.message.includes('already')) {
        throw error; // Keep detailed status message
      } else if (error.message.includes('missing revert data')) {
        throw new Error('Blockchain transaction failed. The claim may not exist, may already be processed, or there may be a contract issue. Please refresh and try again.');
      } else if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction was rejected by user.');
      } else {
        throw error;
      }
    }
  }

  async checkUser() {
    try {
      await this.initialize();
      const userAddress = await this.signer.getAddress();
      const result = await this.callContractFunction('checkUser', userAddress);
      return result;
    } catch (error) {
      console.error('Failed to check user role:', error);
      return 0; // Return NONE role as fallback
    }
  }

  async registerUser(role, companyName = '') {
    try {
      let result;
      
      if (role === 2 && companyName) {
        // Insurance provider with company name
        result = await this.callContractFunction('registerUser', role, companyName);
      } else {
        // Patient or backward compatibility
        result = await this.callContractFunction('registerUser', role);
      }
      
      // Wait for transaction confirmation if it's a transaction
      if (result && result.wait) {
        await result.wait();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to register user:', error);
      throw error;
    }
  }

  async getMyAssignedClaims() {
    try {
      const result = await this.callContractFunction('getMyAssignedClaims');
      return this.processClaimsData(result);
    } catch (error) {
      console.error('Failed to get assigned claims:', error);
      return [];
    }
  }

  async getUserCompany(address = null) {
    try {
      await this.initialize();
      const userAddress = address || await this.signer.getAddress();
      const result = await this.callContractFunction('getUserCompany', userAddress);
      return result || '';
    } catch (error) {
      console.error('Failed to get user company:', error);
      return '';
    }
  }

  async getRegisteredCompanies() {
    try {
      const result = await this.callContractFunction('getRegisteredCompanies');
      return result || [];
    } catch (error) {
      console.error('Failed to get registered companies:', error);
      return ['SBI', 'HDFC', 'LIC', 'ICICI Lombard'];
    }
  }

  processClaimsData(rawClaims) {
    if (!rawClaims || rawClaims.length === 0) {
      console.log('No claims data to process');
      return [];
    }

    console.log(`Processing ${rawClaims.length} claims...`);

    return rawClaims.map((claim, index) => {
      try {
        // Handle BigInt claimId properly
        let claimId;
        if (claim.claimId !== undefined && claim.claimId !== null) {
          claimId = parseInt(claim.claimId.toString());
        } else {
          claimId = index + 1; // Fallback
        }

        const processedClaim = {
          claimId: claimId,
          patient: claim.patient || 'Unknown Patient',
          plan: claim.plan || 'Unknown Plan',
          amount: claim.amount ? claim.amount.toString() : '0', // Keep as string to avoid BigInt issues
          description: claim.description || 'No description',
          status: claim.status || 'Unknown',
          timestamp: claim.timestamp ? parseInt(claim.timestamp.toString()) : Date.now(),
          ipfsHash: claim.ipfsHash || '',
          insuranceCompany: claim.insuranceCompany || 'Unknown Company',
          assignedInsurer: claim.assignedInsurer || '0x0'
        };

        console.log(`Processed claim ${index}: ID=${processedClaim.claimId}, Status=${processedClaim.status}`);
        return processedClaim;
      } catch (processingError) {
        console.error('Error processing claim:', claim, processingError);
        return {
          claimId: index + 1,
          patient: 'Error',
          plan: 'Error Processing',
          amount: '0',
          description: 'Error processing this claim',
          status: 'Error',
          timestamp: Date.now(),
          ipfsHash: '',
          insuranceCompany: 'Unknown',
          assignedInsurer: '0x0'
        };
      }
    });
  }
}

// Create a singleton instance
const contractService = new ContractService();

export default contractService;
