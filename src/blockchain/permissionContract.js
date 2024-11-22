import { ethers } from "ethers";
import permissionContractABI from "./contractABI.json"; // Import ABI from the JSON file

// Address of the deployed Permission contract
const permissionContractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

// Create a provider (e.g., for MetaMask)
const provider = new ethers.providers.Web3Provider(window.ethereum);

// Get the signer (current connected account in MetaMask)
const signer = provider.getSigner();

// Initialize the contract instance
const permissionContract = new ethers.Contract(
  permissionContractAddress,
  permissionContractABI,
  signer
);

/**
 * Request Non-Incentive-Based Permission
 * @param {string} ownerAddress - The address of the owner of the health record.
 * @param {string} dataHash - The hash of the data being requested.
 */
export async function requestNonIncentivePermission(ownerAddress, dataHash) {
  try {
    const permissionType = 2; // NONINCENTIVEBASED
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
 * Request Incentive-Based Permission
 * @param {string} ownerAddress - The address of the owner of the health record.
 * @param {string} dataHash - The hash of the data being requested.
 * @param {string} incentiveAmount - The amount of ETH to offer as an incentive.
 */
export async function requestIncentivePermission(ownerAddress, dataHash, incentiveAmount) {
  try {
    const permissionType = 1; // INCENTIVEBASED
    const tx = await permissionContract.requestIncentiveBasedPermission(
      ownerAddress,
      dataHash,
      permissionType,
      {
        value: ethers.utils.parseEther(incentiveAmount), // Convert ETH to Wei
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
 * Approve Permission
 * @param {string} requestId - The unique ID of the permission request to approve.
 */
export async function approvePermission(requestId) {
  try {
    const tx = await permissionContract.approvePermission(requestId);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Permission approved:", receipt);
    return receipt;
  } catch (error) {
    console.error("Error approving permission:", error);
    throw error;
  }
}

/**
 * Revoke Permission
 * @param {string} dataHash - The hash of the data whose permission needs to be revoked.
 * @param {string} userAddress - The address of the user whose permission is being revoked.
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
 * Check Permission Expiry
 * @param {string} requestId - The unique ID of the permission request to check.
 * @returns {boolean} - Whether the permission is expired or still valid.
 */
export async function isPermissionExpired(requestId) {
  try {
    // Fetch the permission request details from the contract
    const permissionRequest = await permissionContract.permissionRequests(requestId);

    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const isExpired = currentTime > permissionRequest.expiryDate;

    console.log("Permission Expiry Status:", isExpired ? "Expired" : "Valid");
    return isExpired;
  } catch (error) {
    console.error("Error checking permission expiry:", error);
    throw error;
  }
}

// Example Usage
// (async () => {
//   try {
//     // Example data
//     const ownerAddress = "0xOwnerAddressHere";
//     const dataHash = ethers.utils.id("Sample Health Record");
//     const requestId = "0xRequestIdHere"; // Replace with actual request ID
//     const userAddress = "0xUserAddressHere"; // Address whose permission might be revoked
//     const incentiveAmount = "0.1"; // Incentive in ETH

//     // Request non-incentive permission
//     const nonIncentiveReceipt = await requestNonIncentivePermission(ownerAddress, dataHash);
//     console.log("Non-Incentive-Based Permission Receipt:", nonIncentiveReceipt);

//     // Request incentive-based permission
//     const incentiveReceipt = await requestIncentivePermission(ownerAddress, dataHash, incentiveAmount);
//     console.log("Incentive-Based Permission Receipt:", incentiveReceipt);

//     // Approve permission
//     const approveReceipt = await approvePermission(requestId);
//     console.log("Permission Approved Receipt:", approveReceipt);

//     // Check if the permission is expired
//     const isExpired = await isPermissionExpired(requestId);
//     console.log("Permission Expired:", isExpired);

//     // Revoke permission
//     const revokeReceipt = await revokePermission(dataHash, userAddress);
//     console.log("Permission Revoked Receipt:", revokeReceipt);
//   } catch (error) {
//     console.error("Error in permission operations:", error);
//   }
// })();
