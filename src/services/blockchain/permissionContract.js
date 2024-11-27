import { ethers, BrowserProvider } from "ethers";
import contractABI from "../../contractABI.json"; // Import ABI from the JSON file

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const provider = new BrowserProvider(window.ethereum);

const signer = provider.getSigner();

const permissionContract = new ethers.Contract(contractAddress, contractABI.abi, signer)