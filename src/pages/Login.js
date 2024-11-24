import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import contractABI from '../contractABI.json';
import Input from '../components/Input';
import Button from '../components/Button';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const adminAddress = process.env.REACT_APP_ADMIN_ADDRESS;

const Login = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const connectWallet = async (showToast = false) => {
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
        toast.error('Failed to connect wallet. Please try again.', {
          position: "top-right",
          autoClose: 1000,
        });
      }
    } else {
      toast.error('MetaMask is not installed.', {
        position: "top-right",
        autoClose: 1000,
      });
    }
  };

  useEffect(() => {
    connectWallet(false); // Don't show toast on auto-connect
  }, []);

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        window.location.reload(); // Reload the page when the account changes
      } else {
        toast.warn('Please connect to MetaMask.', {
          position: "top-right",
          autoClose: 1000,
        });
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
      toast.error('Please enter your wallet address', {
        position: "top-right",
        autoClose: 1000,
      });
      return;
    }

    setLoading(true);
    try {
      const signer = await connectWallet(true); // Show toast on manual connect
      if (!signer) return;

      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      const userRole = await contract.checkUser(walletAddress);
      console.log(userRole);

      const role = userRole.toString();

      if (role === '0') {
        toast.error('User is not registered', {
          position: "top-right",
          autoClose: 1000,
        });
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading('Logging in...', {
        position: "top-right",
      });

      switch (role) {
        case '1':
          toast.update(loadingToast, {
            render: 'Logged in as Patient',
            type: 'success',
            isLoading: false,
            autoClose: 1000,
          });
          setTimeout(() => navigate('/dashboard/patient'), 2000);
          break;
        case '2':
          toast.update(loadingToast, {
            render: 'Logged in as Doctor',
            type: 'success',
            isLoading: false,
            autoClose: 1000,
          });
          setTimeout(() => navigate('/dashboard/doctor'), 2000);
          break;
        case '3':
          toast.update(loadingToast, {
            render: 'Logged in as Researcher',
            type: 'success',
            isLoading: false,
            autoClose: 1000,
          });
          setTimeout(() => navigate('/dashboard/researcher'), 2000);
          break;
        default:
          if (walletAddress.toLowerCase() === adminAddress.toLowerCase()) {
            toast.update(loadingToast, {
              render: 'Logged in as Admin',
              type: 'success',
              isLoading: false,
              autoClose: 1000,
            });
            setTimeout(() => navigate('/admin'), 2000);
          } else {
            toast.update(loadingToast, {
              render: 'Unknown role or insufficient permissions',
              type: 'error',
              isLoading: false,
              autoClose: 1000,
            });
          }
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(`Login failed: ${error.message}`, {
        position: "top-right",
        autoClose: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (walletAddress.toLowerCase() === adminAddress.toLowerCase()) {
      toast.success('Logged in as Admin', {
        position: "top-right",
        autoClose: 1000,
      });
      setTimeout(() => navigate('/admin'), 2000);
    } else {
      toast.error('You are not authorized to log in as Admin', {
        position: "top-right",
        autoClose: 1000,
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Login</h1>

        <Input
          label="Wallet Address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter your wallet address"
          readOnly
        />

        <Button 
          label={loading ? 'Logging in...' : 'Login'} 
          onClick={handleLogin} 
          disabled={loading}
        />

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
              onClick={() => handleAdminLogin('/admin-login')}
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