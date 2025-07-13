import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, Typography, Button, Dialog, TextField, Alert } from '@mui/material';
import FileDownloader from '../files/FileDownloader';
import { BrowserProvider, ethers } from 'ethers';
import contractABI from '../../contractABI.json';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const InsuranceDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [claimRequests, setClaimRequests] = useState([]);
  const [accessibleRecords, setAccessibleRecords] = useState([]);
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRequestAccess = async (patientAddress, recordId) => {
    try {
      // Call smart contract function to request access
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

  const handleProcessClaim = async (claimId) => {
    try {
      // Implement claim processing logic
      // Update claim status in the blockchain
      setAlertMessage('Claim processed successfully');
      setAlertSeverity('success');
      setOpenAlert(true);
    } catch (error) {
      setAlertMessage('Failed to process claim');
      setAlertSeverity('error');
      setOpenAlert(true);
    }
  };

  const handleDownload = (record) => {
    setSelectedRecord(record);
    setOpenDownloadDialog(true);
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Claims" />
          <Tab label="Accessible Records" />
        </Tabs>
      </Box>

      {/* Claims Tab */}
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Insurance Claims
        </Typography>
        {claimRequests.map((claim) => (
          <Box key={claim.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography>Patient: {claim.patientAddress}</Typography>
            <Typography>Claim Amount: {claim.amount} ETH</Typography>
            <Typography>Status: {claim.status}</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleProcessClaim(claim.id)}
              sx={{ mt: 1 }}
            >
              Process Claim
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleRequestAccess(claim.patientAddress, claim.recordId)}
              sx={{ mt: 1, ml: 1 }}
            >
              Request Records
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleBatchAccessRequest(claim.patientAddress)}
              sx={{ mt: 1, ml: 1 }}
            >
              Request Batch Access
            </Button>
          </Box>
        ))}
      </TabPanel>

      {/* Accessible Records Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Accessible Medical Records
        </Typography>
        {accessibleRecords.map((record) => (
          <Box key={record.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography>Patient: {record.patientAddress}</Typography>
            <Typography>Record Type: {record.type}</Typography>
            <Typography>Date: {new Date(record.timestamp * 1000).toLocaleDateString()}</Typography>
            <Button
              variant="contained"
              onClick={() => handleDownload(record)}
              sx={{ mt: 1 }}
            >
              Download Record
            </Button>
          </Box>
        ))}
      </TabPanel>

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

export default InsuranceDashboard;