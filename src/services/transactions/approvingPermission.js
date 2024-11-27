

export async function grantPermission(requestId, symmetricKey, requesterPublicKey, permissionContract) {
    try {
      const encryptedSymmetricKey = "b2f7e1dcb5a785d6a17a473b2c8d0809ef9a60442ed9f50c8e96d5194c7f9b0f";
      if (!encryptedSymmetricKey) throw new Error("Failed to encrypt symmetric key.");
  
      const tx = await permissionContract.approvePermission(requestId, encryptedSymmetricKey);
      console.log("Transaction sent:", tx.hash);
  
      const receipt = await tx.wait();
      console.log("Permission granted successfully:", receipt);
      return receipt;
    } catch (error) {
      console.error("Error granting permission:", error);
      throw error;
    }
  }