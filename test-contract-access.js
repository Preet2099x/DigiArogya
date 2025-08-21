const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Contract configuration
const INSURANCE_CONTRACT_ADDRESS = '0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f';
const BLOCKCHAIN_URL = 'http://127.0.0.1:8545';

async function testContractAccess() {
    console.log('🔍 Testing Contract Access...');
    console.log('='.repeat(50));
    
    try {
        // 1. Create provider
        console.log('1. Creating provider...');
        const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_URL);
        
        // 2. Test network connection
        console.log('2. Testing network connection...');
        try {
            const network = await provider.getNetwork();
            console.log(`✅ Network connected: Chain ID ${network.chainId}`);
        } catch (error) {
            console.log(`❌ Network connection failed: ${error.message}`);
            return;
        }
        
        // 3. Check if contract exists at address
        console.log('3. Checking contract code...');
        try {
            const code = await provider.getCode(INSURANCE_CONTRACT_ADDRESS);
            if (code === '0x') {
                console.log(`❌ No contract deployed at ${INSURANCE_CONTRACT_ADDRESS}`);
                console.log('   The address has no bytecode.');
                return;
            } else {
                console.log(`✅ Contract exists at ${INSURANCE_CONTRACT_ADDRESS}`);
                console.log(`   Bytecode length: ${code.length} characters`);
            }
        } catch (error) {
            console.log(`❌ Error checking contract code: ${error.message}`);
            return;
        }
        
        // 4. Load ABI
        console.log('4. Loading contract ABI...');
        const abiPath = path.join(__dirname, 'src', 'insuranceContractABI.json');
        let contractABI;
        try {
            const abiData = fs.readFileSync(abiPath, 'utf8');
            contractABI = JSON.parse(abiData);
            console.log(`✅ ABI loaded, ${contractABI.length} functions found`);
        } catch (error) {
            console.log(`❌ Error loading ABI: ${error.message}`);
            return;
        }
        
        // 5. Create contract instance
        console.log('5. Creating contract instance...');
        let contract;
        try {
            contract = new ethers.Contract(INSURANCE_CONTRACT_ADDRESS, contractABI, provider);
            console.log('✅ Contract instance created');
        } catch (error) {
            console.log(`❌ Error creating contract instance: ${error.message}`);
            return;
        }
        
        // 6. Test basic read operations
        console.log('6. Testing basic read operations...');
        
        // Test nextClaimId
        try {
            console.log('   Testing nextClaimId...');
            const nextClaimId = await contract.nextClaimId();
            console.log(`   ✅ nextClaimId: ${nextClaimId.toString()}`);
        } catch (error) {
            console.log(`   ❌ nextClaimId failed: ${error.message}`);
            console.log(`   Error code: ${error.code}`);
            console.log(`   Error data: ${error.data || 'none'}`);
        }
        
        // Test getAllInsuranceClaims
        try {
            console.log('   Testing getAllInsuranceClaims...');
            const claims = await contract.getAllInsuranceClaims();
            console.log(`   ✅ getAllInsuranceClaims: ${claims.length} claims found`);
            
            if (claims.length > 0) {
                console.log('   First few claims:');
                claims.slice(0, 3).forEach((claim, index) => {
                    console.log(`     Claim ${index + 1}:`);
                    console.log(`       ID: ${claim.claimId?.toString() || 'undefined'}`);
                    console.log(`       Status: ${claim.status || 'undefined'}`);
                    console.log(`       Amount: ${claim.amount?.toString() || 'undefined'}`);
                });
            }
        } catch (error) {
            console.log(`   ❌ getAllInsuranceClaims failed: ${error.message}`);
            console.log(`   Error code: ${error.code}`);
            console.log(`   Error data: ${error.data || 'none'}`);
        }
        
        // 7. Test with MetaMask (if available)
        console.log('7. Testing MetaMask integration...');
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                console.log(`✅ MetaMask connected: ${address}`);
                
                const contractWithSigner = new ethers.Contract(INSURANCE_CONTRACT_ADDRESS, contractABI, signer);
                const nextClaimId = await contractWithSigner.nextClaimId();
                console.log(`✅ Contract accessible via MetaMask, nextClaimId: ${nextClaimId.toString()}`);
            } catch (error) {
                console.log(`❌ MetaMask test failed: ${error.message}`);
            }
        } else {
            console.log('   ⚠️  MetaMask not available (running in Node.js)');
        }
        
        console.log('\n✅ Contract access test completed successfully!');
        
    } catch (error) {
        console.log(`❌ Unexpected error: ${error.message}`);
        console.log('Full error:', error);
    }
}

// Run the test
if (require.main === module) {
    testContractAccess().catch(console.error);
}

module.exports = { testContractAccess };
