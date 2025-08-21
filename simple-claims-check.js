// SIMPLE CLAIMS CHECKER - Paste this in browser console

(async function checkClaims() {
  console.log('🔍 Checking Claims State...');
  
  try {
    if (!window.ethereum) {
      console.log('❌ MetaMask not found');
      return;
    }
    
    const { ethers } = window;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Simple ABI for the functions we need
    const abi = [
      "function getAllInsuranceClaims() view returns (tuple(uint256 claimId, address patient, string plan, uint256 amount, string description, string status, uint256 timestamp, string ipfsHash, string insuranceCompany, address assignedInsurer)[])",
      "function nextClaimId() view returns (uint256)"
    ];
    
    const contract = new ethers.Contract('0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f', abi, signer);
    
    // Get basic info
    const nextClaimId = await contract.nextClaimId();
    const claims = await contract.getAllInsuranceClaims();
    
    console.log(`📊 Next Claim ID: ${nextClaimId}`);
    console.log(`📊 Total Claims: ${claims.length}`);
    
    if (claims.length === 0) {
      console.log('❌ NO CLAIMS FOUND!');
      console.log('💡 Solution: Go to Debug Panel and create test claims');
      return;
    }
    
    // Check each claim
    claims.forEach((claim, i) => {
      const id = claim.claimId.toString();
      const status = claim.status;
      const isValidRange = parseInt(id) < parseInt(nextClaimId.toString());
      const canProcess = status === 'Pending' && isValidRange;
      
      console.log(`Claim ${i + 1}: ID=${id}, Status=${status}, CanProcess=${canProcess}`);
    });
    
    // Specifically check claim 7
    const claim7 = claims.find(c => c.claimId.toString() === '7');
    if (claim7) {
      console.log(`\n🎯 CLAIM 7 STATUS: ${claim7.status}`);
      if (claim7.status === 'Pending') {
        console.log('✅ Claim 7 is pending - should be processable');
      } else {
        console.log('❌ Claim 7 is already processed - cannot approve/reject again');
      }
    } else {
      console.log('❌ CLAIM 7 NOT FOUND');
    }
    
    return { nextClaimId: nextClaimId.toString(), claimsCount: claims.length, claim7Status: claim7?.status || 'NOT_FOUND' };
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
