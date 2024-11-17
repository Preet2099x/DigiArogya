import React from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';

const Login = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = React.useState('');

  const handleLogin = () => {
    console.log('Logging in with wallet address:', walletAddress);
    // Add wallet verification logic here
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
        />
        <Button label="Login" onClick={handleLogin} />
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
              onClick={() => navigate('/admin-login')}
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
