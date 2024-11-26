import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LogoutButton from '../../components/ui/LogoutButton';
import { ToastContainer } from "react-toastify";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [action, setAction] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  // Mock data: Replace this with actual data from your backend or blockchain.
  const mockUsers = [
    {
      walletAddress: '0x123...abc',
      role: 'Patient',
      verificationStatus: 'Pending',
      activeStatus: 'Active',
      publicKey: 'Hash123',
    },
    {
      walletAddress: '0x456...def',
      role: 'Provider',
      verificationStatus: 'Verified',
      activeStatus: 'Active',
      licenseNumber: 'LIC12345',
    },
  ];

  useEffect(() => {
    // Simulate fetching data
    setUsers(mockUsers);
  }, []);

  const handleAction = (userWallet, actionType) => {
    console.log(```Performing ${actionType} on ${userWallet}```);
    // Update user status logic here
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
      <div className="max-w-4xl w-full bg-white p-8 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div>
      {/* Render the logout button */}
      <LogoutButton />
      
      {/* ToastContainer to display toasts */}
      <ToastContainer />
    </div>
        </div>

        {/* User List */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">Wallet Address</th>
                <th className="border border-gray-300 px-4 py-2">Role</th>
                <th className="border border-gray-300 px-4 py-2">Verification Status</th>
                <th className="border border-gray-300 px-4 py-2">Active Status</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index} className="text-center">
                  <td className="border border-gray-300 px-4 py-2">{user.walletAddress}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.role}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.verificationStatus}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.activeStatus}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Button
                      label="Verify"
                      onClick={() => handleAction(user.walletAddress, 'Verify')}
                      className="mr-2 bg-green-500 text-white px-2 py-1"
                    />
                    <Button
                      label="Deactivate"
                      onClick={() => handleAction(user.walletAddress, 'Deactivate')}
                      className="bg-red-500 text-white px-2 py-1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Manual Action Section */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Perform Manual Actions</h2>
          <Input
            label="Wallet Address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter wallet address"
          />
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full mb-4"
          >
            <option value="">Select Action</option>
            <option value="Verify">Verify User</option>
            <option value="Deactivate">Deactivate User</option>
          </select>
          <Button
            label="Submit Action"
            onClick={() => handleAction(walletAddress, action)}
            className="bg-blue-500 text-white px-4 py-2"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;