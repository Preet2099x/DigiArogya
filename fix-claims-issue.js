const { ethers } = require('ethers');
const contractABI = require('./src/contractABI.json');
const insuranceABI = require('./src/insuranceContractABI.json');

async function fixClaimsIssue() {
  try {
    console.log('🔧 Diagnosing and fixing claims processing issue...\n');

    // Check if we can connect to MetaMask
    if (!window || !window.ethereum) {
      console.log('❌ MetaMask not detected. This script needs to run in browser with MetaMask.');
      console.log('💡 Alternative: Use the browser console in your React app.\n');
      
      console.log('📋 Browser Console Commands to run:');
      console.log('=====================================');
      console.log('// First, get the nextClaimId');
      console.log('const { ethers } = require("ethers");');
      console.log('const insuranceABI = require("./src/insuranceContractABI.json");');
      console.log('const provider = new ethers.BrowserProvider(window.ethereum);');
      console.log('const signer = await provider.getSigner();');
      console.log('const contract = new ethers.Contract("0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f", insuranceABI.abi, signer);');
      console.log('const nextClaimId = await contract.nextClaimId();');
      console.log('console.log("Next Claim ID:", nextClaimId.toString());');
      console.log('');
      console.log('// Then get all claims');
      console.log('const allClaims = await contract.getAllInsuranceClaims();');
      console.log('console.log("All Claims:", allClaims);');
      console.log('console.log("Number of claims:", allClaims.length);');
      console.log('');
      console.log('// Check specific claim IDs');
      console.log('allClaims.forEach((claim, index) => {');
      console.log('  console.log(`Claim ${index}: ID=${claim.claimId}, Status=${claim.status}, Patient=${claim.patient}`);');
      console.log('});');
      
      return;
    }

    // Connect to blockchain using MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    console.log(`🔑 Connected to: ${await signer.getAddress()}`);

    // Contract addresses
    const INSURANCE_CONTRACT_ADDRESS = '0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f';
    
    // Connect to insurance contract
    const insuranceContract = new ethers.Contract(
      INSURANCE_CONTRACT_ADDRESS,
      insuranceABI.abi,
      signer
    );

    // Step 1: Check nextClaimId
    console.log('📊 Checking contract state...');
    const nextClaimId = await insuranceContract.nextClaimId();
    console.log(`Next Claim ID: ${nextClaimId}`);

    // Step 2: Get all claims
    const allClaims = await insuranceContract.getAllInsuranceClaims();
    console.log(`Total Claims: ${allClaims.length}`);

    if (allClaims.length === 0) {
      console.log('⚠️  No claims found! This explains the transaction failure.');
      console.log('🔧 Creating a sample claim for testing...\n');
      
      try {
        const accounts = await provider.listAccounts();
        const patientAddress = accounts[1]?.address || await signer.getAddress();
        
        console.log(`Adding sample claim for patient: ${patientAddress}`);
        
        const addTx = await insuranceContract.addInsuranceClaim(
          patientAddress,
          'Test Health Insurance Plan',
          ethers.parseEther('0.01'), // 0.01 ETH
          'Sample claim for testing approval/rejection',
          'QmTestHashForFixing123'
        );
        
        console.log('⏳ Transaction submitted, waiting for confirmation...');
        await addTx.wait();
        console.log('✅ Sample claim added successfully!\n');
        
        // Refresh claims
        const updatedClaims = await insuranceContract.getAllInsuranceClaims();
        console.log(`Updated claims count: ${updatedClaims.length}`);
        
        if (updatedClaims.length > 0) {
          const latestClaim = updatedClaims[updatedClaims.length - 1];
          console.log(`Latest claim ID: ${latestClaim.claimId}`);
          console.log(`Status: ${latestClaim.status}`);
          
          if (latestClaim.status === 'Pending') {
            console.log('\n🔄 Testing claim approval...');
            
            try {
              const processTx = await insuranceContract.processInsuranceClaim(latestClaim.claimId, true);
              await processTx.wait();
              console.log('✅ Claim approved successfully!');
              
              // Check updated status
              const finalClaims = await insuranceContract.getAllInsuranceClaims();
              const processedClaim = finalClaims.find(c => c.claimId === latestClaim.claimId);
              console.log(`Final status: ${processedClaim.status}`);
              
            } catch (processError) {
              console.error('❌ Error processing claim:', processError.message);
              console.log('\n🔍 Debugging info:');
              console.log(`Claim ID being processed: ${latestClaim.claimId}`);
              console.log(`Next Claim ID: ${await insuranceContract.nextClaimId()}`);
              console.log(`Condition check: ${latestClaim.claimId} > 0 && ${latestClaim.claimId} < ${await insuranceContract.nextClaimId()}`);
            }
          }
        }
        
      } catch (error) {
        console.error('❌ Error creating sample claim:', error.message);
      }
      
    } else {
      console.log('\n📋 Existing Claims:');
      for (let i = 0; i < allClaims.length; i++) {
        const claim = allClaims[i];
        console.log(`\nClaim ${i + 1}:`);
        console.log(`  ID: ${claim.claimId}`);
        console.log(`  Patient: ${claim.patient}`);
        console.log(`  Status: ${claim.status}`);
        console.log(`  Amount: ${ethers.formatEther(claim.amount)} ETH`);
        console.log(`  Valid for processing: ${claim.claimId > 0 && claim.claimId < nextClaimId}`);
      }

      // Find a claim that can be processed
      const procesableClaim = allClaims.find(claim => 
        claim.status === 'Pending' && 
        claim.claimId > 0 && 
        claim.claimId < nextClaimId
      );

      if (procesableClaim) {
        console.log(`\n🔄 Found processable claim: ${procesableClaim.claimId}`);
        console.log('Testing claim processing...');
        
        try {
          const processTx = await insuranceContract.processInsuranceClaim(procesableClaim.claimId, true);
          await processTx.wait();
          console.log('✅ Claim processed successfully!');
          
        } catch (processError) {
          console.error('❌ Error processing claim:', processError.message);
          console.log('🔍 This is the exact error you\'re experiencing in the UI.');
        }
      } else {
        console.log('\n⚠️  No processable pending claims found.');
        console.log('This explains why you\'re getting the "missing revert data" error.');
      }
    }

    console.log('\n📊 Final State Summary:');
    console.log(`Next Claim ID: ${await insuranceContract.nextClaimId()}`);
    const finalClaims = await insuranceContract.getAllInsuranceClaims();
    console.log(`Total Claims: ${finalClaims.length}`);
    const pendingClaims = finalClaims.filter(c => c.status === 'Pending');
    console.log(`Pending Claims: ${pendingClaims.length}`);
    
    if (pendingClaims.length > 0) {
      console.log('\n✅ You now have pending claims that can be processed!');
    } else {
      console.log('\n💡 Add more claims through the UI to test approval/rejection.');
    }

  } catch (error) {
    console.error('❌ Error in fix script:', error);
    
    if (error.message.includes('user rejected transaction')) {
      console.log('ℹ️  User cancelled the transaction.');
    } else if (error.message.includes('MetaMask')) {
      console.log('ℹ️  MetaMask connection issue. Make sure MetaMask is unlocked and connected.');
    }
  }
}

// Export for browser use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = fixClaimsIssue;
} else {
  // Browser environment
  window.fixClaimsIssue = fixClaimsIssue;
}

console.log('🔧 Claims Fix Script Loaded');
console.log('Run: fixClaimsIssue() in browser console');
