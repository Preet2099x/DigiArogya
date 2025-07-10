import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import AdminLogin from './pages/auth/AdminLogin';
import AdminPanel from './pages/admin/AdminPanel';
import PatientDashboard from './components/dashboard/PatientDashboard';
import DoctorDashboard from './components/dashboard/DoctorDashboard';
import ResearcherDashboard from './components/dashboard/ResearcherDashboard';
import InsuranceDashboard from './components/dashboard/InsuranceDashboard';
import PharmacyDashboard from './components/dashboard/PharmacyDashboard';
import LabDashboard from './components/dashboard/LabDashboard';
import AmbulanceDashboard from './components/dashboard/AmbulanceDashboard';
import HospitalDashboard from './components/dashboard/HospitalDashboard';
import LandingPage from './pages/landingPage/LandingPage';


const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
        <Route path="/dashboard/researcher" element={<ResearcherDashboard />} />
        <Route path="/dashboard/hospital" element={<HospitalDashboard />} />
        <Route path="/dashboard/insurance" element={<InsuranceDashboard />} />
        <Route path="/dashboard/pharmacy" element={<PharmacyDashboard />} />
        <Route path="/dashboard/lab" element={<LabDashboard />} />
        <Route path="/dashboard/ambulance" element={<AmbulanceDashboard />} />
      </Routes>

      {/* Toast Container for notifications */}
      <ToastContainer position="top-right" autoClose={5000} />
    </Router>
  );
};

export default App;
