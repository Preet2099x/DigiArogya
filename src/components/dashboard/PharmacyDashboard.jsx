import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, Typography, Button, Dialog, TextField, Alert, Card, CardContent, CircularProgress } from '@mui/material';
import FileDownloader from '../files/FileDownloader';
import { BrowserProvider, ethers } from 'ethers';
import contractABI from '../../contractABI.json';
import { getDataTypeName } from '../../utils/getDataType';

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
  const [patientAddress, setPatientAddress] = useState('');
  const [patientRecords, setPatientRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleBatchAccessRequest = async (patientAddr) => {
    try {
      if (!patientAddr) {
        setAlertMessage('Please enter patient\'s address');
        setAlertSeverity('warning');
        setOpenAlert(true);
        return;
      }

      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );

      // Request batch access
      const tx = await contract.requestBatchAccess(patientAddr);
      await tx.wait();

      setAlertMessage('Batch access request sent successfully. Waiting for patient approval.');
      setAlertSeverity('success');
      setOpenAlert(true);
    } catch (error) {
      console.error('Batch access request error:', error);
      let errorMessage = 'Failed to request batch access';

      if (error.message.includes('Invalid owner address')) {
        errorMessage = 'Invalid patient address provided';
      } else if (error.message.includes('Owner must be a patient')) {
        errorMessage = 'The provided address is not registered as a patient';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else {
        errorMessage += ': ' + (error.reason || error.message);
      }

      setAlertMessage(errorMessage);
      setAlertSeverity('error');
      setOpenAlert(true);
    } finally {
      setIsLoading(false);
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

  const handleDownload = (record) => {
    setSelectedPrescription(record);
    setOpenDownloadDialog(true);
  };

  const handleGetPatientRecords = async () => {
    try {
      if (!patientAddress) {
        setAlertMessage('Please enter patient\'s address');
        setAlertSeverity('warning');
        setOpenAlert(true);
        return;
      }

      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      
      // Get patient's records
      const records = await contract.getHealthRecordsByOwner(patientAddress);
      
      // Filter for subscription records and transform for display
      const formattedRecords = records
        .filter(record => Number(record.dataType) === 3) // Assuming 3 is the DataType for PRESCRIPTION
        .map((record, index) => ({
          id: index,
          type: getDataTypeName(Number(record.dataType)),
          timestamp: Number(record.timestamp),
          patientAddress: record.owner,
          ipfsCid: record.ipfsCid,
          encryptedSymmetricKey: record.encryptedSymmetricKey
        }));

      setPatientRecords(formattedRecords);
      
      if (formattedRecords.length === 0) {
        setAlertMessage('No subscription records found for this patient');
        setAlertSeverity('info');
        setOpenAlert(true);
      }
    } catch (error) {
      console.error('Error fetching patient records:', error);
      setAlertMessage('Failed to fetch patient records: ' + (error.reason || error.message));
      setAlertSeverity('error');
      setOpenAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Active Prescriptions" />
          <Tab label="Dispensed Medications" />
          <Tab label="Patient Records" />
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

      {/* Patient Records Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Patient Record Access
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter patient's address to view their subscription records (requires permission)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Patient's Ethereum Address"
                value={patientAddress}
                onChange={(e) => setPatientAddress(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                disabled={isLoading}
              />
              <Button
                variant="contained"
                onClick={handleGetPatientRecords}
                sx={{ height: 56 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Get Records'
                )}
              </Button>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                variant="outlined"
                onClick={() => handleBatchAccessRequest(patientAddress)}
                sx={{ height: 40 }}
                disabled={isLoading || !patientAddress}
              >
                Request Batch Access
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Patient Records List */}
        <Typography variant="h6" gutterBottom>
          Available Records
        </Typography>
        {patientRecords.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No records available. Use the form above to request access.
          </Typography>
        ) : (
          patientRecords.map((record) => (
            <Card key={record.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">
                  Record Type: {record.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Date: {new Date(record.timestamp * 1000).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Patient: {record.patientAddress}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleDownload(record)}
                  sx={{ mt: 1 }}
                >
                  View Record
                </Button>
              </CardContent>
            </Card>
          ))
        )}
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
        onClose={() => setOpenAlert(false)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: openAlert ? 'flex' : 'none',
          zIndex: 9999,
          maxWidth: '80%',
          '& .MuiAlert-message': {
            maxWidth: '100%',
            wordBreak: 'break-word'
          }
        }}
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