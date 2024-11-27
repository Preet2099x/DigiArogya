/**
   * @param {string} requestId
  /**
   * @param {string} dataHash
   * @param {string} userAddress 
   */
  export async function revokePermission(dataHash, userAddress, permissionContract) {
    try {
      const tx = await permissionContract.revokePermission(dataHash, userAddress);
      console.log("Transaction sent:", tx.hash);
  
      const receipt = await tx.wait();
      console.log("Permission revoked:", receipt);
      return receipt;
    } catch (error) {
      console.error("Error revoking permission:", error);
      throw error;
    }
  }