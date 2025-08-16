// Simple script to add sample data to the insurance contract
const { ethers } = require('ethers');

// This would be run in a browser environment or with proper Web3 setup
// For now, it's just a reference

async function addSampleDataToContract() {
    console.log('Adding sample data to insurance contract...');
    
    const contractAddress = '0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f';
    const sampleClaims = [
        {
            patient: '0x742d35Cc8C6C78896b79734C8C2c8b25C4B0CEd3', // Example patient address
            plan: 'Basic Health Plan',
            amount: '0.5', // 0.5 ETH
            description: 'Routine medical checkup',
            ipfsHash: 'QmSampleHash1'
        },
        {
            patient: '0x742d35Cc8C6C78896b79734C8C2c8b25C4B0CEd3',
            plan: 'Premium Health Plan',
            amount: '1.2', // 1.2 ETH
            description: 'Emergency room visit',
            ipfsHash: 'QmSampleHash2'
        },
        {
            patient: '0x8ba1f109551bD432803012645Hac136c24F0cea6', // Another patient address
            plan: 'Basic Health Plan',
            amount: '0.3', // 0.3 ETH
            description: 'Dental cleaning',
            ipfsHash: 'QmSampleHash3'
        }
    ];
    
    console.log('Sample claims to add:');
    sampleClaims.forEach((claim, index) => {
        console.log(`${index + 1}. ${claim.description} - ${claim.amount} ETH - ${claim.plan}`);
    });
    
    console.log('\nTo add these claims:');
    console.log('1. Go to http://localhost:3000/test/insurance');
    console.log('2. Connect your MetaMask wallet');
    console.log('3. Click "Add Sample Data" button');
    console.log('4. Or manually submit claims using the form');
    
    return sampleClaims;
}

// Run if called directly
if (require.main === module) {
    addSampleDataToContract();
}

module.exports = { addSampleDataToContract };
