import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, TextField, Alert, Card, CardContent } from '@mui/material';
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

  const handleEmergencyAccess = async () => {
    try {
      if (!patientAddress) {
        setAlertMessage('Please enter patient\'s address');
        setAlertSeverity('warning');
        setOpenAlert(true);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

      // Request emergency access
      const tx = await contract.emergencyAccess(patientAddress);
      await tx.wait();

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
      setAlertMessage('Failed to get emergency access: ' + error.message);
      setAlertSeverity('error');
      setOpenAlert(true);
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
            />
            <Button
              variant="contained"
              color="error"
              onClick={handleEmergencyAccess}
              sx={{ height: 56 }}
            >
              Get Emergency Access
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
        open={openAlert}
        onClose={() => setOpenAlert(false)}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        {alertMessage}
      </Alert>
    </Box>
  );
};

export default AmbulanceDashboard;