import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import contractABI from '../contractABI.json'; // Ensure ABI is correctly imported
import Input from '../components/Input';
import Button from '../components/Button';

const contractAddress = '0x833B1510f2bBcfBE9D558724DAbd2E8e5dbd06b8'; // Replace with your deployed contract address
const adminAddress = '0xcD38E1Da94c04DE9e0a662b090de5e36D4163Dd2'; // Admin wallet address

const Login = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setWalletAddress(userAddress);
        return signer;
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('MetaMask is not installed.');
    }
  };

  useEffect(() => {
    connectWallet(); // Automatically connect wallet on component mount
  }, []);
  
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

  const handleLogin = async () => {
    if (!walletAddress) {
      alert('Please enter your wallet address');
      return;
    }

    setLoading(true);
    try {
      const signer = await connectWallet();
      if (!signer) return;

      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      const userRole = await contract.checkUser(walletAddress);
      console.log(userRole);

      const role = userRole.toString();

      if (role === '0') {
        alert('User is not registered');
        return;
      }

      switch (role) {
        case '1':
          alert('Logged in as Patient');
          navigate('/dashboard/patient');
          break;
        case '2':
          alert('Logged in as Doctor');
          navigate('/dashboard/doctor');
          break;
        case '3':
          alert('Logged in as Researcher');
          navigate('/dashboard');
          break;
        default:
          if (walletAddress.toLowerCase() === adminAddress.toLowerCase()) {
            alert('Logged in as Admin');
            navigate('/admin');
          } else {
            alert('Unknown role or insufficient permissions');
          }
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (walletAddress.toLowerCase() === adminAddress.toLowerCase()) {
      alert('Logged in as Admin');
      navigate('/admin');
    } else {
      alert('You are not authorized to log in as Admin');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Login</h1>

        <Input
          label="Wallet Address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)} // You can disable this if the field should be non-editable
          placeholder="Enter your wallet address"
          readOnly // Add this to make the field non-editable
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

        <div className="mt-4 text-center">
          <p>
            <button
              className="text-red-500 underline"
              onClick={() =>  handleAdminLogin('/admin-login')}
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
