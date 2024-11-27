export async function isPermissionExpired(requestId, permissionContract) {
    try {
      const permissionRequest = await permissionContract.permissionRequests(requestId);
  
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = currentTime > permissionRequest.expiryDate;
  
      console.log("Permission Expiry Status:", isExpired ? "Expired" : "Valid");
      return isExpired;
    } catch (error) {
      console.error("Error checking permission expiry:", error);
      throw error;
    }
  }