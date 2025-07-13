import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, Typography, Button, Dialog, TextField, Alert } from '@mui/material';
import FileDownloader from '../files/FileDownloader';
import FileUploader from '../files/FileUploader';
import { BrowserProvider, ethers } from 'ethers';
import contractABI from '../../contractABI.json';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const LabDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [testRequests, setTestRequests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRequestAccess = async (patientAddress, testId) => {
    try {
      // Call smart contract function to request access to patient records
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

  const handleUploadResult = (testId) => {
    setSelectedTest(testId);
    setOpenUploadDialog(true);
  };

  const handleDownload = (test) => {
    setSelectedTest(test);
    setOpenDownloadDialog(true);
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Pending Tests" />
          <Tab label="Completed Tests" />
        </Tabs>
      </Box>

      {/* Pending Tests Tab */}
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Pending Laboratory Tests
        </Typography>
        {testRequests.map((test) => (
          <Box key={test.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography>Patient: {test.patientAddress}</Typography>
            <Typography>Doctor: {test.doctorAddress}</Typography>
            <Typography>Test Type: {test.testType}</Typography>
            <Typography>Requested Date: {new Date(test.timestamp * 1000).toLocaleDateString()}</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleUploadResult(test.id)}
              sx={{ mt: 1 }}
            >
              Upload Result
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleRequestAccess(test.patientAddress, test.id)}
              sx={{ mt: 1, ml: 1 }}
            >
              Request Patient History
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleBatchAccessRequest(test.patientAddress)}
              sx={{ mt: 1, ml: 1 }}
            >
              Request Batch Access
            </Button>
          </Box>
        ))}
      </TabPanel>

      {/* Completed Tests Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Completed Tests
        </Typography>
        {completedTests.map((test) => (
          <Box key={test.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography>Patient: {test.patientAddress}</Typography>
            <Typography>Test Type: {test.testType}</Typography>
            <Typography>Completion Date: {new Date(test.completionDate * 1000).toLocaleDateString()}</Typography>
            <Typography>Status: {test.status}</Typography>
            <Button
              variant="outlined"
              onClick={() => handleDownload(test)}
              sx={{ mt: 1 }}
            >
              View Result
            </Button>
          </Box>
        ))}
      </TabPanel>

      {/* File Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
        <Box sx={{ p: 2 }}>
          <FileUploader
            testId={selectedTest}
            onClose={() => setOpenUploadDialog(false)}
            onSuccess={() => {
              setAlertMessage('Test result uploaded successfully');
              setAlertSeverity('success');
              setOpenAlert(true);
            }}
          />
        </Box>
      </Dialog>

      {/* File Download Dialog */}
      <Dialog open={openDownloadDialog} onClose={() => setOpenDownloadDialog(false)}>
        <Box sx={{ p: 2 }}>
          <FileDownloader
            recordInfo={selectedTest}
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

export default LabDashboard;