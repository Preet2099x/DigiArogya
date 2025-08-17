// Contract configuration for different environments and functionalities

// Main EHR Contract (has issues with insurance functions)
export const MAIN_CONTRACT = {
  address: process.env.REACT_APP_CONTRACT_ADDRESS || '0x6396032eD73Ce21c3cA3Ef74BEB953aAA0e9Ea2D',
  name: 'EHRmain',
  hasInsurance: false, // Set to false due to deployment issues
};

// Dedicated Insurance Contract (working)
export const INSURANCE_CONTRACT = {
  address: '0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f',
  name: 'InsuranceContract',
  hasInsurance: true,
};

// Contract selection based on function needed
export const getContractForFunction = (functionName) => {
  switch (functionName) {
    case 'getInsuranceClaims':
    case 'getAllInsuranceClaims':
    case 'addInsuranceClaim':
    case 'processInsuranceClaim':
    case 'addSampleData':
    case 'checkUser':
    case 'registerUser':
      return INSURANCE_CONTRACT; // Use working insurance contract
    default:
      return MAIN_CONTRACT;
  }
};

// Fallback configuration
export const CONTRACT_FALLBACK = {
  useInsuranceContract: true, // Set to true to use working insurance contract
  enableFallback: false, // Disable fallback since we're using the working contract directly
};

const contractConfig = {
  MAIN_CONTRACT,
  INSURANCE_CONTRACT,
  getContractForFunction,
  CONTRACT_FALLBACK,
};

export default contractConfig;
