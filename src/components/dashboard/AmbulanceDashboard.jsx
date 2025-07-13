import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, TextField, Alert, Card, CardContent, CircularProgress } from '@mui/material';
import FileDownloader from '../files/FileDownloader';
import { ethers } from 'ethers';
import contractABI from '../../contractABI.json';
import { getDataTypeName } from '../../utils/getDataType';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const AmbulanceDashboard = () => {
  const [patientAddress, setPatientAddress] = useState('');
  const [emergencyRecords, setEmergencyRecords] = useState([]);
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmergencyAccess = async () => {
    try {
      if (!patientAddress) {
        setAlertMessage('Please enter patient\'s address');
        setAlertSeverity('warning');
        setOpenAlert(true);
        return;
      }

      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

      // Request emergency access
      const tx = await contract.emergencyAccess(patientAddress);
      await tx.wait();

      // Verify emergency access was granted
      const hasAccess = await contract.checkEmergencyAccess(await signer.getAddress(), patientAddress);
      if (!hasAccess) {
        throw new Error('Emergency access verification failed');
      }

      setAlertMessage('Emergency access granted successfully');
      setAlertSeverity('success');
      setOpenAlert(true);
      
      // Fetch patient's records
      const records = await contract.getHealthRecordsByOwner(patientAddress);
      
      // Transform records for display
      const formattedRecords = records.map((record, index) => ({
        id: index,
        type: getDataTypeName(Number(record.dataType)),
        timestamp: Number(record.timestamp),
        patientAddress: record.owner,
        ipfsCid: record.ipfsCid,
        encryptedSymmetricKey: record.encryptedSymmetricKey
      }));

      setEmergencyRecords(formattedRecords);
      
    } catch (error) {
      console.error('Emergency access error:', error);
      let errorMessage = 'Failed to get emergency access';
      
      // Handle specific contract errors
      if (error.message.includes('Invalid patient address')) {
        errorMessage = 'Invalid patient address provided';
      } else if (error.message.includes('Only ambulance services')) {
        errorMessage = 'Only authorized ambulance services can request emergency access';
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

  const handleBatchAccessRequest = async () => {
    try {
      if (!patientAddress) {
        setAlertMessage('Please enter patient\'s address');
        setAlertSeverity('warning');
        setOpenAlert(true);
        return;
      }

      setIsLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

      // Request batch access
      const tx = await contract.requestBatchAccess(patientAddress);
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

  const handleDownload = (record) => {
    setSelectedRecord(record);
    setOpenDownloadDialog(true);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Emergency Access Portal
      </Typography>

      {/* Emergency Access Form */}
      <Card sx={{ mb: 3, bgcolor: '#fff3e0' }}>
        <CardContent>
          <Typography variant="h6" color="error" gutterBottom>
            Emergency Access
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use this form to get immediate access to patient's critical medical records in emergency situations.
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
              color="error"
              onClick={handleEmergencyAccess}
              sx={{ height: 56 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Get Emergency Access'
              )}
            </Button>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant="outlined"
              onClick={handleBatchAccessRequest}
              sx={{ height: 40 }}
              disabled={isLoading}
            >
              Request Batch Access
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Accessible Records Section */}
      <Typography variant="h6" gutterBottom>
        Available Emergency Records
      </Typography>
      {emergencyRecords.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No emergency records available. Use the form above to request access.
        </Typography>
      ) : (
        emergencyRecords.map((record) => (
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

      {/* File Download Dialog */}
      <Dialog open={openDownloadDialog} onClose={() => setOpenDownloadDialog(false)}>
        <Box sx={{ p: 2 }}>
          <FileDownloader
            recordInfo={selectedRecord}
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

export default AmbulanceDashboard;