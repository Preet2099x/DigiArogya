const { BrowserProvider, ethers } = require('ethers');
const contractABI = require('./src/contractABI.json');

// Configuration
const contractAddress = '0x6396032eD73Ce21c3cA3Ef74BEB953aAA0e9Ea2D';

async function testInsuranceFunctions() {
    try {
        console.log('Testing insurance functions...');
        
        // Create a provider connection (this won't work in Node.js without a browser)
        // This is just to test the ABI structure
        
        // Check if the functions exist in the ABI
        const functions = contractABI.abi.filter(item => 
            item.type === 'function' && 
            (item.name === 'getInsuranceClaims' || 
             item.name === 'getAllInsuranceClaims' || 
             item.name === 'addInsuranceClaim')
        );
        
        console.log('Found insurance functions in ABI:');
        functions.forEach(func => {
            console.log(`- ${func.name}(${func.inputs.map(i => `${i.type} ${i.name}`).join(', ')})`);
        });
        
        if (functions.length === 3) {
            console.log('✅ All required insurance functions are present in the ABI');
        } else {
            console.log('❌ Missing insurance functions in the ABI');
        }
        
    } catch (error) {
        console.error('Error testing insurance functions:', error);
    }
}

testInsuranceFunctions();
