import { ethers, BrowserProvider } from "ethers";
import contractABI from "../contractABI.json"; // Import ABI from the JSON file

// Address of the deployed Permission contract
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

// Create a provider (e.g., for MetaMask)
const provider = new BrowserProvider(window.ethereum);

// Get the signer (current connected account in MetaMask)
const signer = provider.getSigner();

// Initialize the contract instance
const permissionContract = new ethers.Contract(contractAddress, contractABI.abi, signer)

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
        value: ethers.parseEther(incentiveAmount), // Convert ETH to Wei
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

/**
 * Grant Permission to a Request
 * @param {string} requestId - The unique ID of the permission request to approve.
 * @param {string} symmetricKey - The symmetric key (unencrypted).
 * @param {string} requesterPublicKey - The public key of the requester for encryption.
 */
export async function grantPermission(requestId, symmetricKey, requesterPublicKey) {
  try {
    // Encrypt the symmetric key with the requester's public key
    const encryptedSymmetricKey = encryptSymmetricKey(symmetricKey, requesterPublicKey);
    if (!encryptedSymmetricKey) throw new Error("Failed to encrypt symmetric key.");

    // Call the smart contract's approvePermission function with the encrypted key
    const tx = await permissionContract.approvePermission(requestId, encryptedSymmetricKey);
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Permission granted successfully:", receipt);
    return receipt;
  } catch (error) {
    console.error("Error granting permission:", error);
    throw error;
  }
}

/**
 * Encrypt the Symmetric Key using the Requester's Public Key
 * @param {string} symmetricKey - The plain symmetric key to encrypt.
 * @param {string} requesterPublicKey - The public key of the requester.
 * @returns {string} - The encrypted symmetric key.
 */
function encryptSymmetricKey(symmetricKey, requesterPublicKey) {
  try {
    // Use an encryption library like 'crypto' or 'ethers' utils
    const publicKeyBuffer = Buffer.from(requesterPublicKey, "hex");
    const symmetricKeyBuffer = Buffer.from(symmetricKey, "utf-8");

    // Example encryption logic (replace with actual library implementation)
    const crypto = require("crypto");
    const encryptedKey = crypto.publicEncrypt(
      {
        key: publicKeyBuffer,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      symmetricKeyBuffer
    );

    return encryptedKey.toString("hex"); // Return the encrypted key as a hex string
  } catch (error) {
    console.error("Error encrypting symmetric key:", error);
    return null;
  }
}