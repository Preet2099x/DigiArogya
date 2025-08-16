import { ethers } from "ethers";

// Function to get all insurance claims for insurance dashboard
export async function getAllInsuranceClaims() {
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

    console.log("Fetching insurance claims from blockchain...");

    // Call the getAllInsuranceClaims function from the smart contract
    const rawClaims = await contract.getAllInsuranceClaims();
    console.log("Raw claims from contract:", rawClaims);

    // Process claims to match expected format
    const processedClaims = rawClaims.map((claim) => ({
      claimId: Number(claim.claimId),
      patient: claim.patient,
      patientName: `Patient ${claim.patient.substring(2, 8)}`,
      ipfsHash: claim.ipfsHash || "",
      claimAmount: ethers.formatEther(claim.amount),
      diagnosis: claim.description || "Medical Treatment",
      hospitalName: `Hospital ${claim.patient.substring(2, 8)}`,
      timestamp: Number(claim.timestamp),
      status: claim.status.toUpperCase(),
      rejectionReason: "",
      insuranceProvider: claim.plan || "",
      plan: claim.plan || "",
      amount: ethers.formatEther(claim.amount),
      description: claim.description || "Medical Treatment"
    }));

    return {
      success: true,
      claims: processedClaims,
      message: "Insurance claims loaded from blockchain successfully."
    };

  } catch (error) {
    console.error("Error in getAllInsuranceClaims:", error);
    throw new Error("Failed to load insurance claims from blockchain: " + error.message);
  }
}

// Function to approve an insurance claim
export async function approveInsuranceClaim(claimId) {
  try {
    console.log("Approving insurance claim:", claimId);

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

    console.log("Approving claim on blockchain...");

    // Call the processInsuranceClaim function with approve = true
    const tx = await contract.processInsuranceClaim(claimId, true);
    console.log("Transaction sent:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    return {
      success: true,
      message: `Insurance claim #${claimId} has been approved successfully`,
      transactionHash: tx.hash
    };

  } catch (error) {
    console.error("Error approving claim:", error);
    throw new Error("Failed to approve claim: " + error.message);
  }
}

// Function to reject an insurance claim
export async function rejectInsuranceClaim(claimId, rejectionReason = "") {
  try {
    console.log("Rejecting insurance claim:", claimId, "Reason:", rejectionReason);

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

    console.log("Rejecting claim on blockchain...");

    // Call the processInsuranceClaim function with approve = false
    const tx = await contract.processInsuranceClaim(claimId, false);
    console.log("Transaction sent:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    return {
      success: true,
      message: `Insurance claim #${claimId} has been rejected`,
      transactionHash: tx.hash
    };

  } catch (error) {
    console.error("Error rejecting claim:", error);
    throw new Error("Failed to reject claim: " + error.message);
  }
}

// Function to get insurance claim details by ID
export async function getInsuranceClaimById(claimId) {
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

    console.log("Fetching claim by ID from blockchain...");

    // Get all claims and filter by ID (alternatively, implement a single claim getter in contract)
    const allClaims = await contract.getAllInsuranceClaims();
    const claim = allClaims.find(c => Number(c.claimId) === claimId);
    
    if (!claim) {
      throw new Error(`Claim with ID ${claimId} not found`);
    }

    // Process claim to match expected format
    const processedClaim = {
      claimId: Number(claim.claimId),
      patient: claim.patient,
      patientName: `Patient ${claim.patient.substring(2, 8)}`,
      ipfsHash: claim.ipfsHash || "",
      claimAmount: ethers.formatEther(claim.amount),
      diagnosis: claim.description || "Medical Treatment",
      hospitalName: `Hospital ${claim.patient.substring(2, 8)}`,
      timestamp: Number(claim.timestamp),
      status: claim.status.toUpperCase(),
      rejectionReason: "",
      insuranceProvider: claim.plan || "",
      plan: claim.plan || "",
      amount: ethers.formatEther(claim.amount),
      description: claim.description || "Medical Treatment"
    };

    return {
      success: true,
      claim: processedClaim
    };

  } catch (error) {
    console.error("Error getting claim by ID:", error);
    throw new Error("Failed to get claim details: " + error.message);
  }
}
