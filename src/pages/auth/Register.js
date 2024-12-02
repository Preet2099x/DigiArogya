import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { keccak256, toUtf8Bytes, isAddress } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import contractABI from "../../contractABI.json";
import { generateAndExportKeys } from "../../services/cryptography/keyPairGenerator";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const Register = () => {
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    publicKeyHash: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateAddressHashFromMetaMask = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask is not installed!");
      return null;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const publicAddress = signer.address;

      if (!isAddress(publicAddress)) {
        throw new Error("Invalid Ethereum address");
      }

      const addressHash = keccak256(toUtf8Bytes(publicAddress));
      return addressHash;
    } catch (error) {
      console.error("Error generating hash:", error.message);
      toast.error("Failed to fetch the wallet address or generate the hash.");
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
  }, []);

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        window.location.reload();
      } else {
        toast.warning("Please connect to MetaMask.");
      }
    };

    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask is required to register!");
      return null;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return signer;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      toast.warning("Please select a role before registering.");
      return;
    }

    setLoading(true);
    try {
      const signer = await connectWallet();
      if (!signer) return;

      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );
      const { publicKeyHash } = formData;

      const roleMap = { PATIENT: 1, PROVIDER: 2, RESEARCHER: 3 };
      const roleValue = roleMap[role];

      if (!contract.registerUser) {
        throw new Error("Contract function registerUser not found");
      }

      const { publicKeyBase64, privateKeyBase64, keyPair } =
        await generateAndExportKeys();

      console.log("User's Public Key (Base64):", publicKeyBase64);
      if (publicKeyBase64) console.log(`PublicKey: ${publicKeyBase64}`);
      const tx = await contract.registerUser(
        roleValue,
        publicKeyHash,
        publicKeyBase64
      );
      await tx.wait();

      const privateKeyBlob = new Blob([privateKeyBase64], {
        type: "text/plain",
      });
      const downloadUrl = URL.createObjectURL(privateKeyBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = "privateKey.txt";

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      URL.revokeObjectURL(downloadUrl);
      console.log("Download completed successfully");

      toast.success(`${role} registered successfully!`);

      // Delay navigation slightly to allow toast to be seen
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Error during registration:", error);
      toast.error(
        "Registration failed: User already registered or other error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Role
          </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Public Key Hash
            </label>
            <input
              type="text"
              name="publicKeyHash"
              value={formData.publicKeyHash}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              readOnly
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <button
          onClick={handleLoginRedirect}
          className="w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Move to Login
        </button>
        {loading && (
          <p className="text-center text-blue-500 mt-4">Processing...</p>
        )}
      </div>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default Register;
