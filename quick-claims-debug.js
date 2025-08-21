// Quick Debug Script for Insurance Claims
// Run this in your browser console to check current state

async function quickDebugClaims() {
  console.log('🔍 Quick Claims Debug - Starting...');
  
  try {
    // Get ethers from the window (since it's loaded in React)
    const { ethers } = window;
    if (!ethers) {
      console.error('❌ Ethers not found. Make sure you\'re in the React app.');
      return;
    }
    
    // Connect to MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    console.log(`✅ Connected as: ${await signer.getAddress()}`);
    
    // Load the ABI (you might need to adjust this path)
    const insuranceContractABI = [
      {
        "inputs": [],
        "name": "getAllInsuranceClaims",
        "outputs": [
          {
            "components": [
              {"internalType": "uint256", "name": "claimId", "type": "uint256"},
              {"internalType": "address", "name": "patient", "type": "address"},
              {"internalType": "string", "name": "plan", "type": "string"},
              {"internalType": "uint256", "name": "amount", "type": "uint256"},
              {"internalType": "string", "name": "description", "type": "string"},
              {"internalType": "string", "name": "status", "type": "string"},
              {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
              {"internalType": "string", "name": "ipfsHash", "type": "string"},
              {"internalType": "string", "name": "insuranceCompany", "type": "string"},
              {"internalType": "address", "name": "assignedInsurer", "type": "address"}
            ],
            "internalType": "struct InsuranceContract.InsuranceClaim[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "nextClaimId",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "uint256", "name": "claimId", "type": "uint256"},
          {"internalType": "bool", "name": "approve", "type": "bool"}
        ],
        "name": "processInsuranceClaim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    // Contract address
    const contractAddress = '0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f';
    
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, insuranceContractABI, signer);
    
    // 1. Check nextClaimId
    console.log('\n📊 Contract State:');
    const nextClaimId = await contract.nextClaimId();
    console.log(`Next Claim ID: ${nextClaimId.toString()}`);
    
    // 2. Get all claims
    const allClaims = await contract.getAllInsuranceClaims();
    console.log(`Total Claims: ${allClaims.length}`);
    
    // 3. Analyze each claim
    console.log('\n📋 Claims Analysis:');
    if (allClaims.length === 0) {
      console.log('❌ NO CLAIMS FOUND - This is why processInsuranceClaim fails!');
      console.log('💡 Solution: Add claims first before trying to approve/reject');
      return;
    }
    
    allClaims.forEach((claim, index) => {
      const claimId = claim.claimId.toString();
      const isValidForProcessing = parseInt(claimId) > 0 && parseInt(claimId) < parseInt(nextClaimId.toString());
      
      console.log(`\nClaim ${index + 1}:`);
      console.log(`  ID: ${claimId}`);
      console.log(`  Status: ${claim.status}`);
      console.log(`  Patient: ${claim.patient}`);
      console.log(`  Amount: ${ethers.formatEther(claim.amount)} ETH`);
      console.log(`  Valid for processing: ${isValidForProcessing}`);
      console.log(`  Can be approved/rejected: ${claim.status === 'Pending' && isValidForProcessing}`);
    });
    
    // 4. Test the specific failing claim ID
    const problemClaimId = 7;
    console.log(`\n🔍 Testing Claim ID ${problemClaimId}:`);
    
    const claimExists = allClaims.some(claim => claim.claimId.toString() === problemClaimId.toString());
    console.log(`  Claim ${problemClaimId} exists: ${claimExists}`);
    
    if (claimExists) {
      const claim = allClaims.find(claim => claim.claimId.toString() === problemClaimId.toString());
      console.log(`  Status: ${claim.status}`);
      console.log(`  Can process: ${claim.status === 'Pending'}`);
    }
    
    const isInValidRange = problemClaimId > 0 && problemClaimId < parseInt(nextClaimId.toString());
    console.log(`  In valid range (${problemClaimId} > 0 && ${problemClaimId} < ${nextClaimId}): ${isInValidRange}`);
    
    // 5. Provide solution
    console.log('\n💡 SOLUTION:');
    if (allClaims.length === 0) {
      console.log('1. No claims exist - add claims first');
      console.log('2. Use the "Create Test Claim" button in debug panel');
    } else if (!isInValidRange) {
      console.log(`1. Claim ID ${problemClaimId} is out of range`);
      console.log(`2. Valid range is 1 to ${parseInt(nextClaimId.toString()) - 1}`);
      console.log('3. Only process claims with valid IDs');
    } else {
      const pendingClaims = allClaims.filter(claim => claim.status === 'Pending');
      if (pendingClaims.length === 0) {
        console.log('1. All claims are already processed');
        console.log('2. Add new claims to test approval/rejection');
      } else {
        console.log('1. Valid pending claims exist');
        console.log('2. Try processing these claim IDs:', pendingClaims.map(c => c.claimId.toString()).join(', '));
      }
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
    console.log('\n💡 Try running this in the browser console while on your React app page');
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.quickDebugClaims = quickDebugClaims;
  console.log('🔧 Quick debug function loaded. Run: quickDebugClaims()');
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = quickDebugClaims;
}
