import React, { useState } from 'react';
import PatientForm from '../components/PatientForm';
import ProviderForm from '../components/ProviderForm';
import ResearcherForm from '../components/ResearcherForm';
import RegulatorForm from '../components/RegulatorForm';

const Register = () => {
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    walletAddress: '',
    publicKeyHash: '',
    licenseNumber: '',
    institutionName: '',
    regulatoryAuthorityName: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Registering as ${role}`, formData);
    // Add registration logic here
  };

  const renderForm = () => {
    switch (role) {
      case 'PATIENT':
        return <PatientForm formData={formData} onChange={handleChange} onSubmit={handleSubmit} />;
      case 'PROVIDER':
        return <ProviderForm formData={formData} onChange={handleChange} onSubmit={handleSubmit} />;
      case 'RESEARCHER':
        return <ResearcherForm formData={formData} onChange={handleChange} onSubmit={handleSubmit} />;
      case 'REGULATOR':
        return <RegulatorForm formData={formData} onChange={handleChange} onSubmit={handleSubmit} />;
      default:
        return null;
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
            <option value="REGULATOR">Regulator</option>
          </select>
        </div>
        {renderForm()}
      </div>
    </div>
  );
};

export default Register;
