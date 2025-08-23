import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  TextField, 
  Alert, 
  Card, 
  CardContent, 
  CircularProgress,
  Paper,
  Tooltip,
  IconButton,
  Snackbar,
  Fade
} from '@mui/material';
import FileDownloader from '../files/FileDownloader';
import { BrowserProvider, ethers } from 'ethers';
import contractABI from '../../contractABI.json';
import { getDataTypeName } from '../../utils/getDataType';
import LogoutButton from '../ui/LogoutButton';
import { LocalHospital, AccessTime, Person, Description, Refresh as RefreshIcon } from '@mui/icons-material';

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

  // Removed batch access request function as it's no longer needed

  const handleDownload = (record) => {
    setSelectedRecord(record);
    setOpenDownloadDialog(true);
  };

  return (
    <Box sx={{ width: '100%', p: 3, bgcolor: '#fef6f6' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3, bgcolor: '#fff', borderTop: '4px solid #d32f2f' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocalHospital sx={{ color: '#d32f2f', mr: 1 }} />
            <Typography variant="h5" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
              Ambulance Emergency Portal
            </Typography>
          </Box>
          <LogoutButton />
        </Box>
      </Paper>

      {/* Emergency Access Form */}
      <Paper elevation={3} sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
        <Box sx={{ bgcolor: '#d32f2f', p: 2, color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            Emergency Access
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
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
               disabled={isLoading}
               sx={{ height: 56 }}
               startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
             >
               {isLoading ? 'Processing...' : 'Get Emergency Access'}
             </Button>
          </Box>
        </Box>
      </Paper>

      {/* Accessible Records Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'medium' }}>
            Available Emergency Records
          </Typography>
          <Tooltip title="Refresh Records">
            <IconButton onClick={handleEmergencyAccess} disabled={isLoading} color="error">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {emergencyRecords.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Description sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No emergency records available. Use the form above to request access.
            </Typography>
          </Box>
        ) : (
          emergencyRecords.map((record) => (
            <Paper key={record.id} sx={{ mb: 2, p: 2, border: '1px solid #f5f5f5' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: '#d32f2f' }}>
                    {record.type}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <AccessTime sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(record.timestamp * 1000).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Person sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {record.patientAddress.substring(0, 8)}...{record.patientAddress.substring(record.patientAddress.length - 6)}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => handleDownload(record)}
                >
                  View Record
                </Button>
              </Box>
            </Paper>
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
</Paper>

      <Snackbar
        open={openAlert}
        autoHideDuration={6000}
        onClose={() => setOpenAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={Fade}
      >
        <Alert
          severity={alertSeverity}
          onClose={() => setOpenAlert(false)}
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AmbulanceDashboard;