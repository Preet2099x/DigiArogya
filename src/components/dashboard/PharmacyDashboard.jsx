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
  Dialog,
  Paper,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import { BrowserProvider, ethers } from 'ethers';
import contractABI from '../../contractABI.json';
import { getDataTypeName } from '../../utils/getDataType';
import FileDownloader from '../files/FileDownloader';
import { LocalPharmacy, AccessTime, Person, Description, Refresh as RefreshIcon } from '@mui/icons-material';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

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

  const checkPrescriptionStatus = async (ipfsCid) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      
      // Get the record status from the blockchain
      const recordData = await contract.getHealthRecordByIpfs(ipfsCid);
      // According to recordStatusMap in PatientDashboard.jsx:
      // 0: "Pending", 1: "Completed", 2: "Valid", 3: "Invalid"
      return Number(recordData.status) === 1; // Return true if prescription is processed (COMPLETED)
    } catch (error) {
      console.error(`Error checking prescription status for ${ipfsCid}:`, error);
      return false; // Assume not processed in case of error
    }
  };

  const fetchApprovedRecords = async () => {
    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      
      // Get all records that the pharmacy has access to
      const records = await contract.getRecordsByCareProvider(await signer.getAddress());
      
      // Filter for records of type PRESCRIPTION
      let formattedRecords = records
        .filter(record => Number(record.dataType) === 3) // PRESCRIPTION type
        .map((record, index) => ({
          id: index,
          type: getDataTypeName(Number(record.dataType)),
          timestamp: Number(record.timestamp),
          patientAddress: record.owner,
          ipfsCid: record.ipfsCid,
          encryptedSymmetricKey: record.encryptedSymmetricKey,
          isProcessing: false,
          status: 'Pending' // Default status for UI clarity
        }));

      // Check status of each prescription and filter out processed ones
      const statusChecks = await Promise.all(
        formattedRecords.map(record => checkPrescriptionStatus(record.ipfsCid))
      );
      
      // Filter out processed prescriptions
      formattedRecords = formattedRecords.filter((record, index) => !statusChecks[index]);
      console.log(`Filtered out ${statusChecks.filter(status => status).length} completed prescriptions`);

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
    
    // Set up refresh interval to periodically check for processed prescriptions
    const refreshInterval = setInterval(() => {
      if (tabValue === 1 && !isLoading) {
        fetchApprovedRecords();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [tabValue]);
  
  // Add an effect to refresh records when the component mounts
  useEffect(() => {
    if (tabValue === 1) {
      fetchApprovedRecords();
    }
  }, []);

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

  const handleProcessPrescription = async (clickedRecord) => {
      // Set a loading state for the specific card being processed
      setPatientRecords(prevRecords =>
        prevRecords.map(r =>
          r.id === clickedRecord.id ? { ...r, isProcessing: true } : r
        )
      );

      try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

          // Call the smart contract function to process the prescription
          const tx = await contract.processPrescription(clickedRecord.ipfsCid);

          setAlertMessage('Processing transaction... please wait for confirmation.');
          setAlertSeverity('info');
          setOpenAlert(true);

          await tx.wait(); // Wait for the transaction to be mined

          // On success, immediately remove the record from the UI
          setPatientRecords(prevRecords => prevRecords.filter(r => r.ipfsCid !== clickedRecord.ipfsCid));

          setAlertMessage('Prescription processed successfully! Status changed to Completed.');
          setAlertSeverity('success');
          setOpenAlert(true);

      } catch (error) {
          console.error('Error processing prescription:', error);
          let errorMessage = 'Failed to process prescription: ' + (error.reason || error.message);
          if (error.code === 'ACTION_REJECTED') {
              errorMessage = 'Transaction was rejected by the user.';
          }
          setAlertMessage(errorMessage);
          setAlertSeverity('error');
          setOpenAlert(true);

          // Reset the loading state for the card on failure
          setPatientRecords(prevRecords =>
              prevRecords.map(r =>
                  r.id === clickedRecord.id ? { ...r, isProcessing: false } : r
              )
          );
      }
  };
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
     <Box sx={{ 
      p: 3, 
      background: 'linear-gradient(120deg, #2196F3 0%, #1976D2 100%)',
      color: 'white'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <LocalPharmacy sx={{ fontSize: 40 }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Pharmacy Dashboard
        </Typography>
      </Box>
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        sx={{
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-selected': { color: 'white' }
          },
          '& .MuiTabs-indicator': { backgroundColor: 'white' }
        }}
      >
        <Tab label="Request Access" />
        <Tab label="Approved Records" />
      </Tabs>
    </Box>

    {/* Main Page Content Area */}
    <Box sx={{ 
      flexGrow: 1,
      p: { xs: 2, md: 4 },
      bgcolor: '#f5f7fa'
    }}>
      {/* Request Access Tab */}
      <TabPanel value={tabValue} index={0}>
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1976D2', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person /> Request Patient Record Access
          </Typography>
          <Box sx={{ 
            mt: 3,
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <TextField
              label="Patient Address"
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              sx={{ flexGrow: 1 }}
              variant="outlined"
              placeholder="Enter patient's Ethereum address"
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => handleBatchAccessRequest(patientAddress)}
              disabled={isLoading}
              sx={{
                minWidth: { xs: '100%', sm: 'auto' },
                py: 1.5,
                px: 4,
                borderRadius: 2
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Request Access'}
            </Button>
          </Box>
        </Paper>
      </TabPanel>

      {/* 🟢 Approved Records Tab (Restored Code) */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#1976D2', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description /> Approved Patient Records
          </Typography>
          <Button 
            variant="outlined" 
            onClick={fetchApprovedRecords}
            disabled={isLoading}
            startIcon={<RefreshIcon />}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : patientRecords.length > 0 ? (
          <Box sx={{ 
            display: 'grid', 
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            mt: 3
          }}>
            {patientRecords.map((record) => (
              <Fade in={true} key={record.id}>
                <Card sx={{ 
                  borderRadius: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Prescription Record
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description fontSize="small" /> Type: {record.type}
                      </Typography>
                      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" /> 
                        Date: {new Date(record.timestamp * 1000).toLocaleDateString()}
                      </Typography>
                      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" /> 
                        Patient: {record.patientAddress}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2,
                      flexDirection: { xs: 'column', sm: 'row' }
                    }}>
                      <Tooltip title="View prescription details">
                        <Button
                          variant="outlined"
                          onClick={() => handleDownload(record)}
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          View Record
                        </Button>
                      </Tooltip>
                      <Tooltip title="Mark prescription as processed">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleProcessPrescription(record)} // This should call our new function
                            disabled={record.isProcessing}
                            fullWidth
                            sx={{ borderRadius: 2 }}
                        >
                            {record.isProcessing ? (
                                <>
                                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                                    Processing...
                                </>
                            ) : (
                                'Process Prescription'
                            )}
                        </Button>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            ))}
          </Box>
        ) : (
          <Paper 
            elevation={0} 
            sx={{ 
              textAlign: 'center', 
              p: 4, 
              mt: 3,
              backgroundColor: '#f5f5f5',
              borderRadius: 2
            }}
          >
            <Typography color="text.secondary">
              No accessible records found. Use the "Request Access" tab to request permission from patients.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              All processed prescriptions have been automatically filtered out.
            </Typography>
          </Paper>
        )}
      </TabPanel>
    </Box>

    {/* Dialogs and Snackbars */}
    <Dialog
      open={openDownloadDialog}
      onClose={() => handleDownloadDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <FileDownloader
        onClose={() => handleDownloadDialog(false)}
        ipfsHash={selectedRecord?.ipfsCid}
        encryptedSymmetricKey={selectedRecord?.encryptedSymmetricKey}
      />
    </Dialog>

    <Snackbar
      open={openAlert}
      autoHideDuration={6000}
      onClose={() => setOpenAlert(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={() => setOpenAlert(false)}
        severity={alertSeverity}
        sx={{ width: '100%' }}
        variant="filled"
      >
        {alertMessage}
      </Alert>
    </Snackbar>
  </Box>
  );
};

export default PharmacyDashboard;