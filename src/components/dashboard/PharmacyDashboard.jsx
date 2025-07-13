import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, Typography, Button, Dialog, TextField, Alert } from '@mui/material';
import FileDownloader from '../files/FileDownloader';
import { BrowserProvider, ethers } from 'ethers';
import contractABI from '../../contractABI.json';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const PharmacyDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [prescriptions, setPrescriptions] = useState([]);
  const [dispensedMedications, setDispensedMedications] = useState([]);
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRequestAccess = async (patientAddress, prescriptionId) => {
    try {
      // Call smart contract function to request prescription access
      // Implementation needed based on contract integration
      setAlertMessage('Access request sent successfully');
      setAlertSeverity('success');
      setOpenAlert(true);
    } catch (error) {
      setAlertMessage('Failed to send access request');
      setAlertSeverity('error');
      setOpenAlert(true);
    }
  };

  const handleBatchAccessRequest = async (patientAddress) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );

      // Call the smart contract method for requesting batch access
      const tx = await contract.requestBatchAccess(patientAddress);

      // Wait for the transaction to be mined
      await tx.wait();

      setAlertMessage('Batch access request sent successfully');
      setAlertSeverity('success');
      setOpenAlert(true);
    } catch (error) {
      console.error('Error requesting batch access:', error);
      setAlertMessage('Failed to send batch access request');
      setAlertSeverity('error');
      setOpenAlert(true);
    }
  };

  const handleDispenseMedication = async (prescriptionId) => {
    try {
      // Implement medication dispensing logic
      // Update prescription status in the blockchain
      setAlertMessage('Medication dispensed successfully');
      setAlertSeverity('success');
      setOpenAlert(true);
    } catch (error) {
      setAlertMessage('Failed to dispense medication');
      setAlertSeverity('error');
      setOpenAlert(true);
    }
  };

  const handleDownload = (prescription) => {
    setSelectedPrescription(prescription);
    setOpenDownloadDialog(true);
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Active Prescriptions" />
          <Tab label="Dispensed Medications" />
        </Tabs>
      </Box>

      {/* Active Prescriptions Tab */}
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Active Prescriptions
        </Typography>
        {prescriptions.map((prescription) => (
          <Box key={prescription.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography>Patient: {prescription.patientAddress}</Typography>
            <Typography>Doctor: {prescription.doctorAddress}</Typography>
            <Typography>Date: {new Date(prescription.timestamp * 1000).toLocaleDateString()}</Typography>
            <Typography>Status: {prescription.status}</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleDispenseMedication(prescription.id)}
              sx={{ mt: 1 }}
            >
              Dispense Medication
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleDownload(prescription)}
              sx={{ mt: 1, ml: 1 }}
            >
              View Prescription
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleBatchAccessRequest(prescription.patientAddress)}
              sx={{ mt: 1, ml: 1 }}
            >
              Request Batch Access
            </Button>
          </Box>
        ))}
      </TabPanel>

      {/* Dispensed Medications Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Dispensed Medications History
        </Typography>
        {dispensedMedications.map((medication) => (
          <Box key={medication.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography>Patient: {medication.patientAddress}</Typography>
            <Typography>Prescription ID: {medication.prescriptionId}</Typography>
            <Typography>Dispensed Date: {new Date(medication.dispensedDate * 1000).toLocaleDateString()}</Typography>
            <Typography>Medication: {medication.medicationName}</Typography>
            <Typography>Quantity: {medication.quantity}</Typography>
            <Button
              variant="outlined"
              onClick={() => handleDownload(medication.prescription)}
              sx={{ mt: 1 }}
            >
              View Original Prescription
            </Button>
          </Box>
        ))}
      </TabPanel>

      {/* File Download Dialog */}
      <Dialog open={openDownloadDialog} onClose={() => setOpenDownloadDialog(false)}>
        <Box sx={{ p: 2 }}>
          <FileDownloader
            recordInfo={selectedPrescription}
            onClose={() => setOpenDownloadDialog(false)}
          />
        </Box>
      </Dialog>

      {/* Alert */}
      <Alert
        severity={alertSeverity}
        open={openAlert}
        onClose={() => setOpenAlert(false)}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        {alertMessage}
      </Alert>
    </Box>
  );
};

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default PharmacyDashboard;