// EMERGENCY CLAIMS DIAGNOSTIC - Run this in browser console NOW

window.emergencyClaimsDebug = async function() {
  console.log('🚨 EMERGENCY CLAIMS DIAGNOSTIC STARTING...');
  
  try {
    // Check if we have access to ethers
    if (!window.ethers) {
      console.error('❌ Ethers not available. Make sure you are on the React app page.');
      return;
    }
    
    const { ethers } = window;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    console.log(`✅ Connected as: ${userAddress}`);
    
    // Minimal ABI for debugging
    const minimalABI = [
      "function getAllInsuranceClaims() view returns (tuple(uint256 claimId, address patient, string plan, uint256 amount, string description, string status, uint256 timestamp, string ipfsHash, string insuranceCompany, address assignedInsurer)[])",
      "function nextClaimId() view returns (uint256)",
      "function processInsuranceClaim(uint256 claimId, bool approve) external"
    ];
    
    const contractAddress = '0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f';
    const contract = new ethers.Contract(contractAddress, minimalABI, signer);
    
    // 1. Check nextClaimId first
    console.log('\n📊 CONTRACT STATE CHECK:');
    const nextClaimId = await contract.nextClaimId();
    console.log(`Next Claim ID: ${nextClaimId.toString()}`);
    
    // 2. Get all claims
    let allClaims;
    try {
      allClaims = await contract.getAllInsuranceClaims();
      console.log(`Total Claims Found: ${allClaims.length}`);
    } catch (claimsError) {
      console.error('❌ Failed to get claims:', claimsError.message);
      console.log('This might mean no claims exist or contract issue');
      allClaims = [];
    }
    
    // 3. Analyze the problematic claim ID 7
    console.log('\n🔍 CLAIM ID 7 ANALYSIS:');
    console.log(`Claim 7 in valid range (7 > 0 && 7 < ${nextClaimId}): ${7 > 0 && 7 < nextClaimId}`);
    
    if (allClaims.length > 0) {
      console.log('\n📋 ALL CLAIMS:');
      allClaims.forEach((claim, index) => {
        const claimId = claim.claimId.toString();
        const isValid = parseInt(claimId) > 0 && parseInt(claimId) < parseInt(nextClaimId.toString());
        console.log(`Claim ${index + 1}: ID=${claimId}, Status="${claim.status}", Valid=${isValid}, Patient=${claim.patient}`);
      });
      
      // Check if claim 7 specifically exists
      const claim7 = allClaims.find(claim => claim.claimId.toString() === '7');
      if (claim7) {
        console.log(`\n✅ FOUND CLAIM 7: Status="${claim7.status}", Patient=${claim7.patient}`);
        if (claim7.status !== 'Pending') {
          console.log(`❌ PROBLEM: Claim 7 is already ${claim7.status}! Only Pending claims can be processed.`);
        }
      } else {
        console.log('❌ CLAIM 7 NOT FOUND in the claims array!');
      }
    } else {
      console.log('❌ NO CLAIMS EXIST AT ALL!');
    }
    
    // 4. Try to understand why the transaction fails
    console.log('\n🔬 TRANSACTION FAILURE ANALYSIS:');
    console.log('The transaction data shows:');
    console.log('- Function: processInsuranceClaim(7, true)');
    console.log('- Contract: 0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f');
    console.log('- From: 0x7D8eCa4dD6fA2b22CF7Eb3d7ec937B490475C7cd');
    
    // 5. Provide specific solution
    console.log('\n💡 SOLUTION:');
    if (allClaims.length === 0) {
      console.log('1. ❌ NO CLAIMS EXIST - Create claims first!');
      console.log('2. Go to Insurance Dashboard → Debug Panel → Create Test Claim');
    } else if (7 >= nextClaimId) {
      console.log(`1. ❌ CLAIM ID 7 IS OUT OF RANGE (must be < ${nextClaimId})`);
      console.log('2. Only process claims with valid IDs');
    } else {
      const claim7 = allClaims.find(claim => claim.claimId.toString() === '7');
      if (!claim7) {
        console.log('1. ❌ CLAIM 7 DOES NOT EXIST');
        console.log('2. Valid claim IDs are:', allClaims.map(c => c.claimId.toString()).join(', '));
      } else if (claim7.status !== 'Pending') {
        console.log(`1. ❌ CLAIM 7 IS ALREADY ${claim7.status.toUpperCase()}`);
        console.log('2. Only Pending claims can be approved/rejected');
        const pendingClaims = allClaims.filter(c => c.status === 'Pending');
        if (pendingClaims.length > 0) {
          console.log('3. Try these pending claims:', pendingClaims.map(c => c.claimId.toString()).join(', '));
        } else {
          console.log('3. No pending claims available - create new ones');
        }
      }
    }
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Read the analysis above');
    console.log('2. Go to Insurance Dashboard → Debug Panel');
    console.log('3. Create test claims if none exist');
    console.log('4. Only process claims that are "Pending" and exist');
    
    return {
      nextClaimId: nextClaimId.toString(),
      totalClaims: allClaims.length,
      claims: allClaims.map(c => ({
        id: c.claimId.toString(),
        status: c.status,
        patient: c.patient
      })),
      claim7Exists: allClaims.some(c => c.claimId.toString() === '7'),
      claim7Status: allClaims.find(c => c.claimId.toString() === '7')?.status || 'NOT_FOUND'
    };
    
  } catch (error) {
    console.error('🔥 DIAGNOSTIC ERROR:', error);
    console.log('Make sure you are:');
    console.log('1. On the React app page');
    console.log('2. Connected to MetaMask');
    console.log('3. On the correct network');
  }
};

console.log('🚨 Emergency diagnostic loaded!');
console.log('Run: emergencyClaimsDebug()');

// Auto-run
emergencyClaimsDebug();
