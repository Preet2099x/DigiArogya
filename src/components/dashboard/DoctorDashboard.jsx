import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import {
  Plus
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../files/FileUploader';
import LogoutButton from '../ui/LogoutButton';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([
    {
      address: '0x123...',
      recordCount: 3,
      lastVisit: '2024-03-10',
      status: 'Active'
    }
  ]);

  const [accessibleRecords, setAccessibleRecords] = useState([
    {
      dataHash: '0x456...',
      patientAddress: '0x789...',
      dataType: 'EHR',
      timestamp: '2024-03-13',
      accessUntil: '2024-04-13'
    }
  ]);

  const [tabValue, setTabValue] = useState(0);
  const [openNewPatientDialog, setOpenNewPatientDialog] = useState(false);
  const [newPatientAddress, setNewPatientAddress] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const [patientAddress, setPatientAddress] = useState('');
  const [recordType, setRecordType] = useState('');
  const [openAlert, setOpenAlert] = useState(false);
  const navigate = useNavigate();

  const [toggleState, setToggleState] = useState({ toggle: false });

  const handleToggle = () => {
    setToggleState(prevState => ({ ...prevState, toggle: !prevState.toggle }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleNewPatientClick = () => {
    setOpenNewPatientDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenNewPatientDialog(false);
    setNewPatientAddress('');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log(`File selected: ${file.name}`);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenAlert(false);
  };

  const handleSendRequest = async () => {
    try {
      // Here you would implement the actual blockchain interaction
      // For now, we'll simulate it with a timeout
      console.log(`Sending request to ${newPatientAddress}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Request sent successfully!');
      handleCloseDialog();
      
      // Add the new patient to the list
      setPatients(prev => [...prev, {
        address: newPatientAddress,
        recordCount: 0,
        lastVisit: '-',
        status: 'Pending'
      }]);
    } catch (error) {
      console.error('Failed to send request. Please try again.');
    }
  };

  const handleUploadRecord = async () => {
    if (!selectedFile || !patientAddress || !recordType) {
      console.error('Please fill in all fields and select a file');
      return;
    }

    try {
      setUploadingRecord(true);
      // Here you would implement the actual file upload and blockchain interaction
      // For now, we'll simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Record uploaded successfully!');
      setSelectedFile(null);
      setPatientAddress('');
      setRecordType('');
      setOpenAlert(true); // Show success alert
    } catch (error) {
      console.error('Failed to upload record. Please try again.');
    } finally {
      setUploadingRecord(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw', 
        overflowX: 'auto', 
        p: 2, 
        backgroundColor: '#f4f6f9', 
      }} 
    >
      <Box sx={{ p: 6, maxWidth: '1200px', mx: 'auto', gap: 6, background: '#f4f6f9', borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold" color="primary">Doctor Dashboard</Typography>
          <div>
            <LogoutButton />
          </div>
        </Box>

        <Box mt={4}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{ borderBottom: 2, borderColor: 'divider' }}
          >
            <Tab
              label="My Patients"
              sx={{ fontWeight: 'bold', color: '#00796b', '&.Mui-selected': { color: '#004d40' } }}
            />
            <Tab
              label="Accessible Records"
              sx={{ fontWeight: 'bold', color: '#00796b', '&.Mui-selected': { color: '#004d40' } }}
            />
            <Tab
              label="Upload Records"
              sx={{ fontWeight: 'bold', color: '#00796b', '&.Mui-selected': { color: '#004d40' } }}
            />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Box mt={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" color="textSecondary">Patient List</Typography>
              <Box display="flex" gap={2}>
                <Button 
                  variant="contained" 
                  startIcon={<Plus />} 
                  sx={{ backgroundColor: '#00796b' }}
                  onClick={handleNewPatientClick}
                >
                  New Patient
                </Button>
              </Box>
            </Box>

            <Card sx={{ marginTop: 2 }}>
              <CardContent>
                <Box overflow="auto">
                  <table style={{ width: '100%' }}>
                    <thead style={{ backgroundColor: '#f0f0f0' }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Patient Address</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Records</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Last Visit</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient) => (
                        <tr key={patient.address} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '12px' }}>{patient.address}</td>
                          <td style={{ padding: '12px' }}>{patient.recordCount}</td>
                          <td style={{ padding: '12px' }}>{patient.lastVisit}</td>
                          <td style={{ padding: '12px' }}>
                            <Typography 
                              variant="body2" 
                              color={patient.status === 'Active' ? 'success.main' : 'warning.main'}
                            >
                              {patient.status}
                            </Typography>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <Button variant="outlined" size="small" sx={{ marginRight: 1 }}>View Records</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {tabValue === 1 && (
          <Card sx={{ marginTop: 4 }}>
            <CardContent>
              <Box overflow="auto">
                <table style={{ width: '100%' }}>
                  <thead style={{ backgroundColor: '#f0f0f0' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Patient</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Record Type</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date Created</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Access Until</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessibleRecords.map((record) => (
                      <tr key={record.dataHash} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '12px' }}>{record.patientAddress}</td>
                        <td style={{ padding: '12px' }}>{record.dataType}</td>
                        <td style={{ padding: '12px' }}>{record.timestamp}</td>
                        <td style={{ padding: '12px' }}>{record.accessUntil}</td>
                        <td style={{ padding: '12px' }}>
                          <Button variant="outlined" size="small" sx={{ marginRight: 1 }}>View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        )}


        { tabValue==2 && (
          <FileUploader userRole={"Provider"}/>
        )}

        <Dialog open={openNewPatientDialog} onClose={handleCloseDialog}>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Patient Ethereum Address"
              type="text"
              fullWidth
              variant="outlined"
              value={newPatientAddress}
              onChange={(e) => setNewPatientAddress(e.target.value)}
              placeholder="0x..."
            />
          </DialogContent>
          <DialogActions><Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSendRequest} variant="contained">
              Send Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Alert */}
        <Snackbar 
          open={openAlert} 
          autoHideDuration={6000} 
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity="success" 
            variant="filled"
            sx={{ width: '100%' }}
          >
            File uploaded successfully!
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default DoctorDashboard;