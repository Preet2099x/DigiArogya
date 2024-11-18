import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import contractABI from '../contractABI.json'; // Ensure ABI is correctly imported
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify CSS
import { ToastContainer } from 'react-toastify'; // Toast container for rendering notifications
import Input from '../components/Input';
import Button from '../components/Button';

const contractAddress = '0xa973ca2b575388367103A68f30b70605420aA991'; // Replace with your deployed contract address
const adminAddress = '0xf09e1779f16B67FE17f66274A61f97a803afd0A0'; // Admin wallet address

const Login = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is required to log in!');
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []); // Request user's Ethereum account
    const signer = provider.getSigner();
    return signer;
  };

  const handleLogin = async () => {
    console.log('logging');
    if (!walletAddress) {
      toast.error('Please enter your wallet address');
      return;
    }

    setLoading(true);
    try {
      const signer = await connectWallet();
      if (!signer) return;

      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

      const userRole = await contract.checkUser(walletAddress); // Returns BigNumber or BigInt
      console.log(userRole);

      // Convert userRole to a string for comparison
      const role = userRole.toString(); // Convert BigNumber to string if using ethers.js

      if (role === '0') {
        toast.error('User is not registered');
        return;
      }

      // Handle user roles and navigate accordingly
      switch (role) {
        case '1': // Patient
          toast.success('Logged in as Patient');
          navigate('/dashboard/patient'); // Navigate to patient dashboard
          break;
        case '2': // Provider (Doctor)
          toast.success('Logged in as Doctor');
          navigate('/dashboard/doctor'); // Navigate to doctor dashboard
          break;
        case '3': // Researcher
          toast.success('Logged in as Researcher');
          navigate('/dashboard'); // Navigate to main dashboard or researcher page
          break;
        default:
          // Admin role (manual check)
          if (walletAddress.toLowerCase() === adminAddress.toLowerCase()) {
            toast.success('Logged in as Admin');
            navigate('/admin'); // Navigate to admin panel
          } else {
            toast.error('Unknown role or insufficient permissions');
          }
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!walletAddress) {
      toast.error('Please enter your wallet address');
      return;
    }

    // Admin-specific login check
    if (walletAddress.toLowerCase() === adminAddress.toLowerCase()) {
      toast.success('Logged in as Admin');
      navigate('/admin'); // Navigate to admin panel
    } else {
      toast.error('You are not authorized to log in as Admin');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
      <ToastContainer /> {/* Required to display toast messages */}
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Login</h1>

        <Input
          label="Wallet Address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter your wallet address"
        />

        <Button label={loading ? 'Logging in...' : 'Login'} onClick={handleLogin} disabled={loading} />

        <div className="mt-4 text-center">
          <p>
            Don't have an account?{' '}
            <button
              className="text-blue-500 underline font-bold"
              onClick={() => navigate('/register')}
            >
              Register Here
            </button>
          </p>
        </div>

        {/* Admin Login Button */}
        <div className="mt-4 text-center">
          <p>
            <button
              className="text-red-500 underline"
              onClick={handleAdminLogin}
            >
              Login as Administrator
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
