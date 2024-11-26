import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';


const AdminLogin = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');

  const systemOwnerWallet = process.env.REACT_APP_ADMIN_ADDRESS; // owner's wallet address from the smart contract.

  const handleLogin = () => {
    if (walletAddress === systemOwnerWallet) {
      console.log('Admin authenticated successfully');
      navigate('/admin');
    } else {
      setError('Invalid wallet address. Only system owners can log in.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <Input
          label="Wallet Address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter your wallet address"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <Button
          label="Login"
          onClick={handleLogin}
          className="mt-4 bg-blue-500 text-white w-full"
        />
      </div>
    </div>
  );
};

export default AdminLogin;
