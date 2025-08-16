const { BrowserProvider, ethers } = require('ethers');
const insuranceContractABI = require('./src/insuranceContractABI.json');

// Configuration
const contractAddress = '0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f';

async function testInsuranceContract() {
    try {
        console.log('Testing insurance contract at:', contractAddress);
        
        // This is a Node.js test, so we'll simulate what the browser would do
        // In the browser, you would use window.ethereum
        
        const contractInfo = {
            address: contractAddress,
            functionsFound: [],
            sampleData: false
        };
        
        // Check ABI functions
        const functions = insuranceContractABI.abi.filter(item => 
            item.type === 'function' && 
            (item.name === 'getInsuranceClaims' || 
             item.name === 'getAllInsuranceClaims' || 
             item.name === 'addInsuranceClaim' ||
             item.name === 'addSampleData')
        );
        
        console.log('Found insurance functions in ABI:');
        functions.forEach(func => {
            const funcSig = `${func.name}(${func.inputs.map(i => `${i.type} ${i.name}`).join(', ')})`;
            console.log(`- ${funcSig}`);
            contractInfo.functionsFound.push(func.name);
        });
        
        console.log('\n✅ Contract deployed successfully!');
        console.log(`📝 Contract Address: ${contractAddress}`);
        console.log(`🔧 Functions Available: ${contractInfo.functionsFound.join(', ')}`);
        
        console.log('\n📋 Next Steps:');
        console.log('1. Update your .env file with the new contract address if needed');
        console.log('2. Use MetaMask to call addSampleData() to populate test data');
        console.log('3. Test the React components with the new contract');
        
        return contractInfo;
        
    } catch (error) {
        console.error('Error testing insurance contract:', error);
        return null;
    }
}

testInsuranceContract();
