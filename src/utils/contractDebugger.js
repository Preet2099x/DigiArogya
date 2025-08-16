import { ethers } from 'ethers';
import contractABI from '../contractABI.json';

/**
 * Smart Contract Debugger Utility
 * Helps debug contract calls and decode revert reasons
 */
export class ContractDebugger {
  constructor(contractAddress, abi = contractABI.abi) {
    this.contractAddress = contractAddress;
    this.abi = abi;
    this.iface = new ethers.Interface(abi);
  }

  /**
   * Decode calldata to show function name and arguments
   */
  decodeCalldata(calldata) {
    try {
      const decoded = this.iface.parseTransaction({ data: calldata });
      
      console.log('🔍 Decoded Function Call:');
      console.log('Function:', decoded.name);
      console.log('Arguments:', decoded.args);
      console.log('Fragment:', decoded.fragment);
      
      // Pretty print arguments with their names
      const inputs = decoded.fragment.inputs;
      const formattedArgs = {};
      inputs.forEach((input, index) => {
        formattedArgs[input.name] = decoded.args[index];
      });
      
      console.log('Named Arguments:', formattedArgs);
      
      return {
        functionName: decoded.name,
        args: decoded.args,
        namedArgs: formattedArgs,
        fragment: decoded.fragment
      };
    } catch (error) {
      console.error('❌ Failed to decode calldata:', error.message);
      return null;
    }
  }

  /**
   * Get detailed revert reason using callStatic
   */
  async getRevertReason(provider, functionName, args, fromAddress) {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.abi, provider);
      
      console.log(`🔄 Calling contract.callStatic.${functionName} to get revert reason...`);
      
      // Create a contract instance with the sender address for simulation
      const contractWithSigner = contract.connect(provider);
      
      // Try the static call
      const result = await contractWithSigner[functionName].staticCall(...args, {
        from: fromAddress
      });
      
      console.log('✅ Static call succeeded. Result:', result);
      return { success: true, result };
      
    } catch (error) {
      console.log('❌ Static call failed with detailed error:');
      
      // Extract detailed error information
      let revertReason = 'Unknown error';
      let errorCode = error.code;
      
      if (error.reason) {
        revertReason = error.reason;
      } else if (error.data) {
        // Try to decode error data
        try {
          const decodedError = this.decodeError(error.data);
          if (decodedError) {
            revertReason = decodedError;
          }
        } catch (decodeErr) {
          console.log('Could not decode error data:', error.data);
        }
      } else if (error.message) {
        revertReason = error.message;
      }
      
      console.log('Revert Reason:', revertReason);
      console.log('Error Code:', errorCode);
      console.log('Full Error:', error);
      
      return { 
        success: false, 
        revertReason, 
        errorCode,
        originalError: error 
      };
    }
  }

  /**
   * Decode error data from failed transactions
   */
  decodeError(errorData) {
    try {
      // Common error selectors
      const errorSelectors = {
        '0x08c379a0': 'Error(string)', // Standard revert with message
        '0x4e487b71': 'Panic(uint256)', // Panic errors (assert, overflow, etc.)
      };
      
      const selector = errorData.slice(0, 10);
      
      if (errorSelectors[selector]) {
        const errorSig = errorSelectors[selector];
        const errorInterface = new ethers.Interface([`error ${errorSig}`]);
        const decoded = errorInterface.parseError(errorData);
        
        if (decoded.name === 'Error') {
          return `Revert: ${decoded.args[0]}`;
        } else if (decoded.name === 'Panic') {
          const panicCode = decoded.args[0];
          return `Panic: ${this.getPanicReason(panicCode)}`;
        }
      }
      
      return `Raw error data: ${errorData}`;
    } catch (err) {
      return `Could not decode error: ${errorData}`;
    }
  }

  /**
   * Get human-readable panic reasons
   */
  getPanicReason(code) {
    const panicReasons = {
      0x01: 'Assert failed',
      0x11: 'Arithmetic overflow/underflow',
      0x12: 'Division by zero',
      0x21: 'Invalid enum value',
      0x22: 'Invalid encoded storage byte array',
      0x31: 'Pop on empty array',
      0x32: 'Array index out of bounds',
      0x41: 'Out of memory',
      0x51: 'Invalid function selector'
    };
    
    return panicReasons[code] || `Unknown panic code: 0x${code.toString(16)}`;
  }

  /**
   * Comprehensive contract call debugger
   */
  async debugContractCall(provider, functionName, args, senderAddress, value = 0) {
    console.log('\n🐛 DEBUGGING CONTRACT CALL');
    console.log('='.repeat(50));
    console.log('Contract:', this.contractAddress);
    console.log('Function:', functionName);
    console.log('Sender:', senderAddress);
    console.log('Value:', value);
    console.log('Arguments:', args);
    
    // Step 1: Check basic prerequisites
    await this.checkPrerequisites(provider, senderAddress);
    
    // Step 2: Try static call first
    const staticResult = await this.getRevertReason(provider, functionName, args, senderAddress);
    
    if (!staticResult.success) {
      console.log('\n❌ STATIC CALL FAILED - TRANSACTION WILL FAIL');
      console.log('Reason:', staticResult.revertReason);
      return staticResult;
    }
    
    // Step 3: Try gas estimation
    try {
      const contract = new ethers.Contract(this.contractAddress, this.abi, provider);
      const gasEstimate = await contract[functionName].estimateGas(...args, {
        from: senderAddress,
        value: value
      });
      
      console.log('✅ Gas Estimate:', gasEstimate.toString());
      return { success: true, gasEstimate, staticResult: staticResult.result };
      
    } catch (gasError) {
      console.log('❌ GAS ESTIMATION FAILED');
      const gasErrorResult = await this.getRevertReason(provider, functionName, args, senderAddress);
      return gasErrorResult;
    }
  }

  /**
   * Check common prerequisites
   */
  async checkPrerequisites(provider, senderAddress) {
    console.log('\n🔍 CHECKING PREREQUISITES');
    console.log('-'.repeat(30));
    
    try {
      // Check account balance
      const balance = await provider.getBalance(senderAddress);
      console.log('Account Balance:', ethers.formatEther(balance), 'ETH');
      
      // Check if contract exists
      const code = await provider.getCode(this.contractAddress);
      console.log('Contract Exists:', code !== '0x');
      
      // Check network
      const network = await provider.getNetwork();
      console.log('Network:', network.name, 'Chain ID:', network.chainId);
      
    } catch (error) {
      console.log('❌ Error checking prerequisites:', error.message);
    }
  }

  /**
   * Enhanced error messages for common issues
   */
  getCommonErrorSuggestions(revertReason) {
    const suggestions = [];
    
    if (revertReason.includes('Only') || revertReason.includes('not authorized')) {
      suggestions.push('❌ Authorization Error: Check if sender has the required role/permissions');
      suggestions.push('💡 Solution: Ensure the caller address has the correct role in the contract');
    }
    
    if (revertReason.includes('already') || revertReason.includes('exists')) {
      suggestions.push('❌ Duplicate Error: Resource already exists');
      suggestions.push('💡 Solution: Check if user is already registered or record already exists');
    }
    
    if (revertReason.includes('Invalid') || revertReason.includes('require')) {
      suggestions.push('❌ Validation Error: Invalid input parameters');
      suggestions.push('💡 Solution: Check all function parameters are valid and meet contract requirements');
    }
    
    if (revertReason.includes('insufficient') || revertReason.includes('balance')) {
      suggestions.push('❌ Balance Error: Insufficient funds');
      suggestions.push('💡 Solution: Ensure account has enough ETH for transaction fees');
    }
    
    return suggestions;
  }
}

/**
 * Enhanced Insurance Claim Submission with Error Handling
 */
export async function submitInsuranceClaimWithDebug(claimData) {
  try {
    console.log('\n🚀 STARTING INSURANCE CLAIM SUBMISSION');
    console.log('='.repeat(50));
    
    if (!window.ethereum) {
      throw new Error("MetaMask is required. Please install MetaMask to continue.");
    }

    // Initialize provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    console.log('User Address:', userAddress);
    console.log('Claim Data:', claimData);

    // Use contract service for insurance claims
    let contractService;
    try {
      const serviceModule = await import('../services/contractService');
      contractService = serviceModule.default;
      console.log('✅ Contract service imported successfully');
    } catch (importError) {
      console.error('❌ Failed to import contract service:', importError);
      throw new Error('Failed to load contract service. Please check the application setup.');
    }

    if (!contractService || typeof contractService.addInsuranceClaim !== 'function') {
      console.error('❌ Contract service or addInsuranceClaim method not available');
      console.log('contractService:', contractService);
      console.log('Available methods:', contractService ? Object.getOwnPropertyNames(Object.getPrototypeOf(contractService)) : 'none');
      throw new Error('Contract service addInsuranceClaim method is not available');
    }
    
    const claimArgs = [
      claimData.patientAddress || userAddress,
      claimData.insurancePlan || "Health Insurance",
      claimData.claimAmount || 0,
      claimData.description || "Medical Treatment",
      claimData.ipfsHash || ""
    ];

    console.log('\n📝 SUBMITTING CLAIM VIA CONTRACT SERVICE');
    console.log('Arguments:', claimArgs);

    // Submit claim using contract service
    const result = await contractService.addInsuranceClaim(...claimArgs);
    
    console.log('\n✅ CLAIM SUBMITTED SUCCESSFULLY');
    console.log('Transaction result:', result);

    return {
      success: true,
      message: "Insurance claim submitted successfully!",
      transactionHash: result.hash || result.transactionHash,
      result: result
    };

  } catch (error) {
    console.error('\n❌ FINAL ERROR:', error);
    throw error;
  }
}

export default ContractDebugger;
