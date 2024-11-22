import { ethers } from "ethers";
import permissionContractABI from "./contractABI.json"; // Import the ABI from the JSON file

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
async function requestNonIncentivePermission(ownerAddress, dataHash) {
  try {
    const permissionType = 2; // NONINCENTIVEBASED
    const tx = await permissionContract.requestNonIncentiveBasedPermission(
      ownerAddress,
      dataHash,
      permissionType
    );
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined
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
async function requestIncentivePermission(ownerAddress, dataHash, incentiveAmount) {
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

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction mined:", receipt);
    return receipt;
  } catch (error) {
    console.error("Error requesting incentive permission:", error);
    throw error;
  }
}

// Example Usage
// (async () => {
//   try {
//     // Example data for non-incentive request
//     const ownerAddress = "0xOwnerAddressHere";
//     const dataHash = ethers.utils.id("Sample Health Record"); // Generate data hash from a string

//     // Non-incentive-based request
//     const nonIncentiveReceipt = await requestNonIncentivePermission(ownerAddress, dataHash);
//     console.log("Non-Incentive-Based Permission Receipt:", nonIncentiveReceipt);

//     // Example data for incentive-based request
//     const incentiveAmount = "0.1"; // 0.1 ETH as incentive

//     // Incentive-based request
//     const incentiveReceipt = await requestIncentivePermission(
//       ownerAddress,
//       dataHash,
//       incentiveAmount
//     );
//     console.log("Incentive-Based Permission Receipt:", incentiveReceipt);
//   } catch (error) {
//     console.error("Error in permission requests:", error);
//   }
// })();
