import { ethers } from "ethers";
import { decryptWithPrivateKey, encryptWithPublicKey } from "../cryptography/asymmetricEncryption";

// Function to approve a permission request
export async function approvePermission(requestId,ownerPrivateKey) {
  try {
    if (!window.ethereum) {
      alert("MetaMask is required!");
      throw new Error("MetaMask not detected.");
    }

    // Initialize provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Contract details
    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS; // Replace with your contract address
    const contractABI = (await import("../../contractABI.json")).abi; // Import your ABI
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log("Preparing to approve permission...");

    console.log("Fetching IPFS CID for requestId:", requestId);

        // Call the getPermissionRequest function
        const permissionRequest = await contract.getPermissionRequest(requestId);
        console.log("Permission Request Data:", permissionRequest);

        const requestDate=permissionRequest[3];
        const expiryDate=permissionRequest[4];

       const ipfscid=permissionRequest[2];   

       const ownerAddress=permissionRequest[1];
       const requesterAddress=permissionRequest[0];

        const recordData=await contract.getHealthRecordByIpfs(ipfscid);
        const dataType=recordData[2];

        const ownerEncryptedSymmetricKey=recordData[3];
        console.log("owner",ownerAddress);
        console.log("ownerEncryptedSymmetricKey",ownerEncryptedSymmetricKey);
        console.log("ownerprivateKey",ownerPrivateKey);

        const originalSymmetricKey= await decryptWithPrivateKey(ownerPrivateKey,ownerEncryptedSymmetricKey);
        console.log(originalSymmetricKey);
        const doctorpublicKeyForEncryption = await contract.getKeyPair(requesterAddress);
        console.log(doctorpublicKeyForEncryption);
        const doctorEncryptedSymmetricKey=await encryptWithPublicKey(doctorpublicKeyForEncryption,originalSymmetricKey);
        console.log(doctorEncryptedSymmetricKey);

        // address _owner,
        // address _careProvider,
        // string memory _ipfsCid,
        // DataType _dataType,
        // string memory _encryptedSymmetricKey,
        // uint256 _approvedDate,
        // uint256 _expiryDate

        const createTxn = await contract.addApprovedRecord(ownerAddress,requesterAddress,ipfscid,dataType,doctorEncryptedSymmetricKey,requestDate,expiryDate,
        {
            gasLimit: 1000000
        }
        );
        
        console.log(createTxn);

    // Call the approvePermission function
    const tx = await contract.approvePermission(requestId);
    console.log("Transaction sent:", tx.hash);


    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction mined:", receipt);


    // Notify the user of successful approval
    alert("Permission successfully approved!");
    return receipt;
  } catch (error) {
    console.error("Error approving permission:", error);
    alert("Failed to approve permission. Please try again.");
    throw error;
  }
}
