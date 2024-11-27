export async function requestIncentivePermission(ownerAddress, dataHash, permissionContract, incentiveAmount) {
    try {
      const permissionType = 1;
      const tx = await permissionContract.requestIncentiveBasedPermission(
        ownerAddress,
        dataHash,
        permissionType,
        {
          value: ethers.parseEther(incentiveAmount),
        }
      );
      console.log("Transaction sent:", tx.hash);
  
      const receipt = await tx.wait();
      console.log("Transaction mined:", receipt);
      return receipt;
    } catch (error) {
      console.error("Error requesting incentive permission:", error);
      throw error;
    }
  }
