import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const HospitalDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Hospital Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add your hospital dashboard components here */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Patient Records</h2>
            <p className="text-gray-600">View and manage patient records</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Staff Management</h2>
            <p className="text-gray-600">Manage hospital staff and departments</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Resource Allocation</h2>
            <p className="text-gray-600">Monitor and manage hospital resources</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;