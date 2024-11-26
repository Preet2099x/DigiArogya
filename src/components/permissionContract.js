import { ethers, BrowserProvider } from "ethers";
import contractABI from "../contractABI.json"; // Import ABI from the JSON file

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const provider = new BrowserProvider(window.ethereum);

const signer = provider.getSigner();

const permissionContract = new ethers.Contract(contractAddress, contractABI.abi, signer)

/**
 * @param {string} ownerAddress 
 * @param {string} dataHash 
 */
export async function requestNonIncentivePermission(ownerAddress, dataHash) {
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

/**
 * @param {string} ownerAddress
 * @param {string} dataHash 
 * @param {string} incentiveAmount
 */
export async function requestIncentivePermission(ownerAddress, dataHash, incentiveAmount) {
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

/**
 * @param {string} requestId
/**
 * @param {string} dataHash
 * @param {string} userAddress 
 */
export async function revokePermission(dataHash, userAddress) {
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

/**
 * @param {string} requestId 
 * @returns {boolean}
 */
export async function isPermissionExpired(requestId) {
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

/**
 * @param {string} requestId 
 * @param {string} symmetricKey  
 * @param {string} requesterPublicKey 
 */
export async function grantPermission(requestId, symmetricKey, requesterPublicKey) {
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