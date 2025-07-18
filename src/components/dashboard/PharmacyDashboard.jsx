import React, { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Button,
  TextField,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Dialog
} from '@mui/material';

import { BrowserProvider, ethers } from 'ethers';
import contractABI from '../../contractABI.json';
import { getDataTypeName } from '../../utils/getDataType';
import FileDownloader from '../files/FileDownloader';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pharmacy-tabpanel-${index}`}
      aria-labelledby={`pharmacy-tab-${index}`}
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

const PharmacyDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [patientAddress, setPatientAddress] = useState('');
  const [patientRecords, setPatientRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchApprovedRecords = async () => {
    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      
      // Get all records that the pharmacy has access to
      const records = await contract.getRecordsByCareProvider(await signer.getAddress());
      
      // Filter for records of type PRESCRIPTION
      const formattedRecords = records
        .filter(record => Number(record.dataType) === 3) // PRESCRIPTION type
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
        setAlertMessage('No accessible prescription records found.');
        setAlertSeverity('info');
        setOpenAlert(true);
      }
    } catch (error) {
      console.error('Error fetching approved records:', error);
      setAlertMessage('Failed to fetch approved records: ' + (error.reason || error.message));
      setAlertSeverity('error');
      setOpenAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 1) {
      fetchApprovedRecords();
    }
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
      
      // Get records that the pharmacy has access to
      const records = await contract.getRecordsByCareProvider(await signer.getAddress());
      
      // Filter for records belonging to the specified patient and of type PRESCRIPTION
      const formattedRecords = records
        .filter(record => 
          record.owner.toLowerCase() === patientAddress.toLowerCase() && 
          Number(record.dataType) === 3 // PRESCRIPTION type
        )
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
        setAlertMessage('No accessible prescription records found for this patient. Please request access if needed.');
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

  const handleDownload = (record) => {
    setSelectedRecord(record);
    setOpenDownloadDialog(true);
  };

  const handleDownloadDialog = (open) => {
    setOpenDownloadDialog(open);
  };

  const handleProcessPrescription = async (record) => {
    try {
      setIsProcessing(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

      // Revoke permission for the prescription record
      const tx = await contract.revokePermission(record.ipfsCid, await signer.getAddress());
      await tx.wait();

      // Remove the processed record from the local state
      setPatientRecords(prevRecords => prevRecords.filter(r => r.ipfsCid !== record.ipfsCid));

      setAlertMessage('Prescription processed successfully');
      setAlertSeverity('success');
      setOpenAlert(true);
    } catch (error) {
      console.error('Error processing prescription:', error);
      setAlertMessage('Failed to process prescription: ' + (error.reason || error.message));
      setAlertSeverity('error');
      setOpenAlert(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Request Access" />
          <Tab label="Approved Records" />
        </Tabs>
      </Box>

      {/* Request Access Tab */}
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Request Patient Record Access
        </Typography>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Patient Address"
            value={patientAddress}
            onChange={(e) => setPatientAddress(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            onClick={() => handleBatchAccessRequest(patientAddress)}
            disabled={isLoading}
          >
            Request Access
          </Button>
        </Box>
      </TabPanel>

      {/* Approved Records Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Approved Patient Records
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : patientRecords.length > 0 ? (
          patientRecords.map((record) => (
            <Card key={record.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Prescription Record
                </Typography>
                <Typography>Type: {record.type}</Typography>
                <Typography>Date: {new Date(record.timestamp * 1000).toLocaleDateString()}</Typography>
                <Typography>Patient: {record.patientAddress}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleDownload(record)}
                    sx={{ mr: 1 }}
                  >
                    View Record
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleProcessPrescription(record)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Process Prescription'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
            No accessible records found. Use the "Request Access" tab to request permission from patients.
          </Typography>
        )}
      </TabPanel>

      {/* File Downloader Dialog */}
      <Dialog
        open={openDownloadDialog}
        onClose={() => handleDownloadDialog(false)}
      >
        <FileDownloader
          onClose={() => handleDownloadDialog(false)}
          ipfsHash={selectedRecord?.ipfsCid}
          encryptedSymmetricKey={selectedRecord?.encryptedSymmetricKey}
        />
      </Dialog>

      {/* Alert Component */}
      <Snackbar
        open={openAlert}
        autoHideDuration={6000}
        onClose={() => setOpenAlert(false)}
      >
        <Alert
          onClose={() => setOpenAlert(false)}
          severity={alertSeverity}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PharmacyDashboard;