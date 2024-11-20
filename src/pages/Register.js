import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { keccak256, toUtf8Bytes, isAddress } from 'ethers'; // Import specific utilities
import contractABI from '../contractABI.json'; // Ensure the ABI is correctly imported

const contractAddress = '0x833B1510f2bBcfBE9D558724DAbd2E8e5dbd06b8'; // Replace with your deployed contract address

const Register = () => {
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    publicKeyHash: '',
  });
  const [loading, setLoading] = useState(false);

  const generateAddressHashFromMetaMask = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return null;
    }
  
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const publicAddress = signer.address; // Use the `address` property instead of `getAddress`
  
      if (!isAddress(publicAddress)) {
        throw new Error("Invalid Ethereum address");
      }
  
      const addressHash = keccak256(toUtf8Bytes(publicAddress));
      return addressHash;
    } catch (error) {
      console.error("Error generating hash:", error.message);
      alert("Failed to fetch the wallet address or generate the hash.");
      return null;
    }
  };

  useEffect(() => {
    const fetchPublicKeyHash = async () => {
      const hash = await generateAddressHashFromMetaMask();
      if (hash) {
        setFormData((prev) => ({ ...prev, publicKeyHash: hash }));
      }
    };

    fetchPublicKeyHash();
  }, []); // Runs only once when the component is mounted

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        window.location.reload(); // Reload the page when the account changes
      } else {
        alert('Please connect to MetaMask.');
      }
    };
  
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
  
    // Cleanup listener on component unmount
    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask is required to register!');
      return null;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []); // Request user's Ethereum account
    const signer = provider.getSigner();
    return signer;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const signer = await connectWallet();
      if (!signer) return;

      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      const { publicKeyHash } = formData;

      const roleMap = { PATIENT: 1, PROVIDER: 2, RESEARCHER: 3 };
      const roleValue = roleMap[role]; // Map role to its enum value

      if (!contract.registerUser) {
        throw new Error("Contract function registerUser not found");
      }

      const tx = await contract.registerUser(roleValue, publicKeyHash);
      await tx.wait(); // Wait for transaction to be mined

      alert(`${role} registered successfully!`);
    } catch (error) {
      console.error("Error during registration:", error);
      alert('Registration failed: User already registered or other error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose your role</option>
            <option value="PATIENT">Patient</option>
            <option value="PROVIDER">Provider</option>
            <option value="RESEARCHER">Researcher</option>
          </select>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Public Key Hash</label>
            <input
              type="text"
              name="publicKeyHash"
              value={formData.publicKeyHash}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              readOnly // Make the field read-only since it's auto-filled
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        {loading && <p className="text-center text-blue-500">Processing...</p>}
      </div>
    </div>
  );
};

export default Register;
