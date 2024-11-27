export async function requestNonIncentivePermission(ownerAddress, dataHash, permissionContract) {
    try {
      const permissionType = 2; 
      const tx = await permissionContract.requestNonIncentiveBasedPermission(
        ownerAddress,
        dataHash,
        permissionType
      );
      console.log("Transaction sent:", tx.hash);
  
      const receipt = await tx.wait();
      console.log("Transaction mined:", receipt);
      return receipt;
    } catch (error) {
      console.error("Error requesting non-incentive permission:", error);
      throw error;
    }
  }