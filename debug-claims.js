const { ethers } = require('ethers');
const contractABI = require('./src/contractABI.json');
const insuranceABI = require('./src/insuranceContractABI.json');

async function debugClaims() {
  try {
    console.log('🔍 Debugging insurance claims...\n');

    // Connect to local blockchain
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const accounts = await provider.listAccounts();
    
    if (accounts.length === 0) {
      console.log('❌ No accounts found. Make sure Ganache is running.');
      return;
    }

    console.log(`📊 Found ${accounts.length} accounts`);
    const signer = await provider.getSigner(0);
    console.log(`🔑 Using account: ${await signer.getAddress()}\n`);

    // Contract addresses
    const INSURANCE_CONTRACT_ADDRESS = '0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f';
    
    // Connect to insurance contract
    const insuranceContract = new ethers.Contract(
      INSURANCE_CONTRACT_ADDRESS,
      insuranceABI.abi,
      signer
    );

    console.log('📋 Getting all insurance claims...');
    const allClaims = await insuranceContract.getAllInsuranceClaims();
    console.log(`Found ${allClaims.length} claims:`);
    
    if (allClaims.length === 0) {
      console.log('⚠️  No claims found! This explains the transaction failure.');
      console.log('Let\'s add a sample claim first...\n');
      
      // Add a sample claim
      const patientAddress = accounts[1] || await signer.getAddress();
      console.log(`Adding sample claim for patient: ${patientAddress}`);
      
      try {
        const tx = await insuranceContract.addInsuranceClaim(
          patientAddress,
          'Test Health Plan',
          ethers.parseEther('0.01'), // 0.01 ETH as claim amount
          'Sample medical claim for testing',
          'QmTestHashForDebugging'
        );
        
        console.log('⏳ Transaction submitted, waiting for confirmation...');
        await tx.wait();
        console.log('✅ Sample claim added successfully!\n');
        
        // Get claims again
        const updatedClaims = await insuranceContract.getAllInsuranceClaims();
        console.log(`📋 Updated claims count: ${updatedClaims.length}`);
        
        for (let i = 0; i < updatedClaims.length; i++) {
          const claim = updatedClaims[i];
          console.log(`\nClaim ${i + 1}:`);
          console.log(`  - ID: ${claim.claimId}`);
          console.log(`  - Patient: ${claim.patient}`);
          console.log(`  - Plan: ${claim.plan}`);
          console.log(`  - Amount: ${ethers.formatEther(claim.amount)} ETH`);
          console.log(`  - Status: ${claim.status}`);
          console.log(`  - Description: ${claim.description}`);
        }
        
      } catch (error) {
        console.error('❌ Error adding sample claim:', error.message);
      }
    } else {
      // Display existing claims
      for (let i = 0; i < allClaims.length; i++) {
        const claim = allClaims[i];
        console.log(`\nClaim ${i + 1}:`);
        console.log(`  - ID: ${claim.claimId}`);
        console.log(`  - Patient: ${claim.patient}`);
        console.log(`  - Plan: ${claim.plan}`);
        console.log(`  - Amount: ${ethers.formatEther(claim.amount)} ETH`);
        console.log(`  - Status: ${claim.status}`);
        console.log(`  - Description: ${claim.description}`);
      }
    }

    // Test processing a claim if claims exist
    const finalClaims = await insuranceContract.getAllInsuranceClaims();
    if (finalClaims.length > 0) {
      const firstClaim = finalClaims[0];
      console.log(`\n🔄 Testing claim processing for claim ID: ${firstClaim.claimId}`);
      
      if (firstClaim.status === 'Pending') {
        try {
          console.log('⏳ Attempting to approve claim...');
          const tx = await insuranceContract.processInsuranceClaim(firstClaim.claimId, true);
          await tx.wait();
          console.log('✅ Claim processed successfully!');
          
          // Check updated status
          const updatedClaims = await insuranceContract.getAllInsuranceClaims();
          const updatedClaim = updatedClaims.find(c => c.claimId === firstClaim.claimId);
          console.log(`📊 Updated status: ${updatedClaim.status}`);
          
        } catch (error) {
          console.error('❌ Error processing claim:', error.message);
          console.error('Error details:', error);
        }
      } else {
        console.log(`ℹ️  Claim is already ${firstClaim.status}, cannot process again.`);
      }
    }

    // Check next claim ID
    const nextClaimId = await insuranceContract.nextClaimId();
    console.log(`\n📊 Next claim ID will be: ${nextClaimId}`);

  } catch (error) {
    console.error('❌ Error in debug script:', error);
  }
}

debugClaims().then(() => {
  console.log('\n🏁 Debug complete');
}).catch(console.error);
