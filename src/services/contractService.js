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
      'processInsuranceClaim'
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

  processClaimsData(rawClaims) {
    if (!rawClaims || rawClaims.length === 0) {
      return [];
    }

    return rawClaims.map((claim, index) => {
      try {
        return {
          claimId: Number(claim.claimId) || index,
          patient: claim.patient || 'Unknown Patient',
          plan: claim.plan || 'Unknown Plan',
          amount: Number(claim.amount) || 0,
          description: claim.description || 'No description',
          status: claim.status || 'Unknown',
          timestamp: Number(claim.timestamp) || Date.now(),
          ipfsHash: claim.ipfsHash || ''
        };
      } catch (processingError) {
        console.error('Error processing claim:', claim, processingError);
        return {
          claimId: index,
          patient: 'Error',
          plan: 'Error Processing',
          amount: 0,
          description: 'Error processing this claim',
          status: 'Error',
          timestamp: Date.now(),
          ipfsHash: ''
        };
      }
    });
  }
}

// Create a singleton instance
const contractService = new ContractService();

export default contractService;
