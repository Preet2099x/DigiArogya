import { ethers } from "ethers";
import { uploadToIPFS } from "../ipfs/ipfsUploader";

// Function to submit an insurance claim
export async function submitInsuranceClaim(claimData) {
  try {
    console.log("Submitting insurance claim:", claimData);

    if (!window.ethereum) {
      throw new Error("MetaMask is required. Please install MetaMask to continue.");
    }

    // Initialize provider and signer for blockchain interaction
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    // Contract details
    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("Contract address not found. Please set REACT_APP_CONTRACT_ADDRESS in your environment variables.");
    }

    const contractABI = (await import("../../contractABI.json")).abi;
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    // Upload documents to IPFS if file is provided
    let ipfsHash = "";
    if (claimData.file) {
      console.log("Uploading claim documents to IPFS...");
      const uploadResult = await uploadToIPFS(claimData.file);
      if (uploadResult.success) {
        ipfsHash = uploadResult.hash;
        console.log("Documents uploaded to IPFS:", ipfsHash);
      } else {
        throw new Error("Failed to upload documents to IPFS");
      }
    }

    console.log("Submitting claim to blockchain...");

    // Convert amount to Wei (assuming input is in ETH)
    const amountInWei = ethers.parseEther(claimData.claimAmount.toString());

    // Call the addInsuranceClaim function
    const tx = await contract.addInsuranceClaim(
      claimData.patientAddress || userAddress,
      claimData.insurancePlan || "Health Insurance",
      amountInWei,
      claimData.description || "Medical Treatment",
      ipfsHash
    );

    console.log("Transaction sent:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    // The claimId is returned from the contract function
    // We need to parse the transaction receipt to get the returned value
    // For now, we'll extract it from the event logs
    let claimId = null;
    if (receipt.logs && receipt.logs.length > 0) {
      // Look for InsuranceClaimAdded event
      const claimAddedEvent = receipt.logs.find(log => log.topics && log.topics[0]);
      if (claimAddedEvent) {
        // Parse the event to get claimId
        const parsedLog = contract.interface.parseLog(claimAddedEvent);
        if (parsedLog && parsedLog.args) {
          claimId = Number(parsedLog.args.claimId);
        }
      }
    }

    return {
      success: true,
      claimId: claimId,
      message: `Insurance claim submitted successfully! Claim ID: ${claimId}`,
      ipfsHash: ipfsHash,
      transactionHash: tx.hash
    };

  } catch (error) {
    console.error("Error submitting insurance claim:", error);
    throw new Error("Failed to submit insurance claim: " + error.message);
  }
}

// Function to get insurance claims for a specific patient
export async function getInsuranceClaimsForPatient(patientAddress) {
  try {
    console.log("Fetching insurance claims for patient:", patientAddress);

    if (!window.ethereum) {
      throw new Error("MetaMask is required. Please install MetaMask to continue.");
    }

    // Initialize provider and signer for blockchain interaction
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Contract details
    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("Contract address not found. Please set REACT_APP_CONTRACT_ADDRESS in your environment variables.");
    }

    const contractABI = (await import("../../contractABI.json")).abi;
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log("Fetching claims from blockchain...");

    // Call the getInsuranceClaims function for the specific patient
    const rawClaims = await contract.getInsuranceClaims(patientAddress);
    console.log("Raw claims for patient:", rawClaims);

    // Process claims to match expected format
    const patientClaims = rawClaims.map((claim) => ({
      claimId: Number(claim.claimId),
      plan: claim.plan || "Health Insurance",
      amount: ethers.formatEther(claim.amount),
      description: claim.description || "Medical Treatment",
      status: claim.status.toUpperCase(),
      timestamp: Number(claim.timestamp),
      rejectionReason: "",
      ipfsHash: claim.ipfsHash || ""
    }));

    return {
      success: true,
      claims: patientClaims,
      message: "Claims loaded from blockchain successfully"
    };

  } catch (error) {
    console.error("Error fetching insurance claims:", error);
    throw new Error("Failed to fetch insurance claims from blockchain: " + error.message);
  }
}

// Function to update insurance claim status
export async function updateInsuranceClaimStatus(claimId, newStatus, rejectionReason = "") {
  try {
    console.log("Updating claim status:", claimId, "to", newStatus);

    if (!window.ethereum) {
      throw new Error("MetaMask is required. Please install MetaMask to continue.");
    }

    // Initialize provider and signer for blockchain interaction
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Contract details
    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("Contract address not found. Please set REACT_APP_CONTRACT_ADDRESS in your environment variables.");
    }

    const contractABI = (await import("../../contractABI.json")).abi;
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log("Updating claim status on blockchain...");

    // Determine if this is an approval or rejection
    const isApproval = newStatus.toLowerCase() === 'approved';

    // Call the processInsuranceClaim function
    const tx = await contract.processInsuranceClaim(claimId, isApproval);
    console.log("Transaction sent:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    return {
      success: true,
      message: `Claim status updated to ${newStatus}`,
      transactionHash: tx.hash
    };

  } catch (error) {
    console.error("Error updating claim status:", error);
    throw new Error("Failed to update claim status: " + error.message);
  }
}

// Function to get insurance claim statistics
export async function getInsuranceClaimStatistics() {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is required. Please install MetaMask to continue.");
    }

    // Initialize provider and signer for blockchain interaction
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Contract details
    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("Contract address not found. Please set REACT_APP_CONTRACT_ADDRESS in your environment variables.");
    }

    const contractABI = (await import("../../contractABI.json")).abi;
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log("Fetching claim statistics from blockchain...");

    // Get all claims to calculate statistics
    const allClaims = await contract.getAllInsuranceClaims();

    const stats = {
      total: allClaims.length,
      pending: allClaims.filter(c => c.status.toLowerCase() === 'pending').length,
      approved: allClaims.filter(c => c.status.toLowerCase() === 'approved').length,
      rejected: allClaims.filter(c => c.status.toLowerCase() === 'rejected').length,
      totalAmount: allClaims.reduce((sum, claim) => {
        return sum + parseFloat(ethers.formatEther(claim.amount));
      }, 0)
    };

    return {
      success: true,
      statistics: stats
    };

  } catch (error) {
    console.error("Error getting claim statistics:", error);
    throw new Error("Failed to get claim statistics: " + error.message);
  }
}
