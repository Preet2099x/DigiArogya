// Test contract service import
async function testContractService() {
  try {
    console.log('Testing contract service import...');
    
    // Test the import
    const contractService = (await import('./src/services/contractService.js')).default;
    console.log('✅ Contract service imported successfully');
    console.log('Contract service type:', typeof contractService);
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(contractService)));
    
    // Check if addInsuranceClaim method exists
    if (typeof contractService.addInsuranceClaim === 'function') {
      console.log('✅ addInsuranceClaim method is available');
    } else {
      console.log('❌ addInsuranceClaim method not found');
    }
    
  } catch (error) {
    console.error('❌ Error testing contract service:', error);
  }
}

testContractService();
