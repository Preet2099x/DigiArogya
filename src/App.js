import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify CSS
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminPanel from './pages/admin/AdminPanel';
import DoctorDashboard from './components/dashboard/DoctorDashboard';
import ResearcherDashboard from './components/dashboard/ResearcherDashboard';
import PatientDashboard from './components/dashboard/PatientDashboard';
import AdminLogin from "./pages/auth/AdminLogin"
import LandingPage from './pages/landingPage/LandingPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
        <Route path="/dashboard/researcher" element={<ResearcherDashboard />} />
      </Routes>

      {/* Include the ToastContainer */}
      <ToastContainer position="top-right" autoClose={5000} />
    </Router>
  );
};

export default App;
