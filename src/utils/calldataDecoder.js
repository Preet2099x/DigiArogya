import { ethers } from 'ethers';
import contractABI from '../contractABI.json';

/**
 * Standalone Calldata Decoder
 * Use this to decode any calldata from failed transactions
 */
export function decodeCalldata(calldata, abi = contractABI.abi) {
  try {
    const iface = new ethers.Interface(abi);
    const decoded = iface.parseTransaction({ data: calldata });
    
    console.log('\n🔍 CALLDATA DECODER RESULTS');
    console.log('='.repeat(40));
    console.log('Calldata:', calldata);
    console.log('Function Name:', decoded.name);
    console.log('Function Signature:', decoded.signature);
    console.log('Raw Arguments:', decoded.args);
    
    // Create named arguments object
    const namedArgs = {};
    decoded.fragment.inputs.forEach((input, index) => {
      const value = decoded.args[index];
      namedArgs[input.name] = {
        type: input.type,
        value: value,
        formatted: formatArgumentValue(value, input.type)
      };
    });
    
    console.log('\nNamed Arguments:');
    Object.entries(namedArgs).forEach(([name, arg]) => {
      console.log(`  ${name} (${arg.type}):`, arg.formatted);
    });
    
    console.log('\nFunction Definition:');
    console.log(`  ${decoded.fragment.format()}`);
    
    return {
      functionName: decoded.name,
      signature: decoded.signature,
      rawArgs: decoded.args,
      namedArgs: namedArgs,
      fragment: decoded.fragment
    };
    
  } catch (error) {
    console.error('❌ Failed to decode calldata:', error.message);
    console.log('Raw calldata:', calldata);
    return null;
  }
}

/**
 * Format argument values for better readability
 */
function formatArgumentValue(value, type) {
  try {
    if (type.startsWith('uint') || type.startsWith('int')) {
      return `${value.toString()} (${ethers.formatEther(value)} ETH)`;
    } else if (type === 'address') {
      return `${value} (${value.slice(0, 6)}...${value.slice(-4)})`;
    } else if (type === 'bool') {
      return value ? 'true' : 'false';
    } else if (type === 'string') {
      return `"${value}"`;
    } else if (type.startsWith('bytes')) {
      return `${value} (${value.length} bytes)`;
    } else {
      return value.toString();
    }
  } catch (err) {
    return value.toString();
  }
}

/**
 * Quick calldata decoder for console use
 * Usage: decodeQuick("0x0e0ff2b8....")
 */
export function decodeQuick(calldata) {
  const result = decodeCalldata(calldata);
  if (result) {
    return {
      function: result.functionName,
      args: result.namedArgs
    };
  }
  return null;
}

/**
 * Static call debugger - call this when you get CALL_EXCEPTION
 */
export async function debugStaticCall(contractAddress, functionName, args, provider, fromAddress) {
  try {
    console.log('\n🔄 STATIC CALL DEBUG');
    console.log('='.repeat(30));
    console.log('Contract:', contractAddress);
    console.log('Function:', functionName);
    console.log('From:', fromAddress);
    console.log('Arguments:', args);
    
    const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);
    
    // Try static call
    const result = await contract[functionName].staticCall(...args, {
      from: fromAddress
    });
    
    console.log('✅ Static call succeeded:', result);
    return { success: true, result };
    
  } catch (error) {
    console.log('❌ Static call failed:');
    console.log('Error Code:', error.code);
    console.log('Error Reason:', error.reason);
    console.log('Error Data:', error.data);
    console.log('Full Error:', error);
    
    // Try to decode error data
    if (error.data) {
      const decodedError = decodeErrorData(error.data);
      console.log('Decoded Error:', decodedError);
    }
    
    return { 
      success: false, 
      error: error.reason || error.message,
      errorCode: error.code,
      errorData: error.data
    };
  }
}

/**
 * Decode error data from reverted transactions
 */
export function decodeErrorData(errorData) {
  try {
    const errorSelectors = {
      '0x08c379a0': 'Error(string)',
      '0x4e487b71': 'Panic(uint256)',
    };
    
    const selector = errorData.slice(0, 10);
    
    if (errorSelectors[selector]) {
      const errorSig = errorSelectors[selector];
      const errorInterface = new ethers.Interface([`error ${errorSig}`]);
      const decoded = errorInterface.parseError(errorData);
      
      if (decoded.name === 'Error') {
        return `Revert with message: "${decoded.args[0]}"`;
      } else if (decoded.name === 'Panic') {
        const panicCode = Number(decoded.args[0]);
        return `Panic error: ${getPanicMessage(panicCode)}`;
      }
    }
    
    return `Unknown error: ${errorData}`;
  } catch (err) {
    return `Could not decode: ${errorData}`;
  }
}

/**
 * Get panic error messages
 */
function getPanicMessage(code) {
  const messages = {
    0x01: 'Assertion failed',
    0x11: 'Arithmetic overflow or underflow',
    0x12: 'Division or modulo by zero',
    0x21: 'Invalid enum value',
    0x22: 'Invalid encoded storage byte array',
    0x31: 'Pop on empty array',
    0x32: 'Array index out of bounds',
    0x41: 'Out of memory',
    0x51: 'Invalid function selector'
  };
  
  return messages[code] || `Unknown panic code: 0x${code.toString(16)}`;
}

// Export for console debugging
if (typeof window !== 'undefined') {
  window.decodeCalldata = decodeCalldata;
  window.decodeQuick = decodeQuick;
  window.debugStaticCall = debugStaticCall;
}

const calldataDecoder = {
  decodeCalldata,
  decodeQuick,
  debugStaticCall,
  decodeErrorData
};

export default calldataDecoder;
