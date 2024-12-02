import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import contractABI from '../../contractABI.json';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

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
    <div className="flex flex-col md:flex-row min-h-screen">
      <motion.button
        className="absolute top-4 left-4 p-2 rounded-full hover:bg-blue-700 transition-colors"
        onClick={() => navigate('/')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ArrowLeft className="h-6 w-6 text-white" />
      </motion.button>
      {/* Left Half with Gradient and Text */}
      <motion.div
        className="w-full md:w-1/2 flex flex-col items-center justify-center bg-blue-600 text-white p-4 md:p-8"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">Welcome Back!</h1>
        <p className="text-base md:text-lg text-center">Connect your wallet to continue.</p>
      </motion.div>
      <motion.div
        className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 md:p-8 bg-gray-50"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-lg shadow-2xl">
          <h1 className="text-2xl font-bold mb-4">Login</h1>

          <div className="space-y-6">
            <Input
              label="Wallet Address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter your wallet address"
              readOnly
              className="w-full"
            />

            <Button
              label={loading ? 'Logging in...' : 'Login'}
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            />
          </div>

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
      </motion.div>
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

export default Login;