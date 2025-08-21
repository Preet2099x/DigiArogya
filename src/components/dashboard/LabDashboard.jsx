import React, { useState } from 'react'; 
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Button,
  Dialog,
  AppBar,
  Toolbar,
  Alert,
  TextField,
  MenuItem
} from '@mui/material';
// import { MenuItem, Button, TextField, Box } from "@mui/material";
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
  const [patientAddress, setPatientAddress] = useState('');   // NEW STATE
  // Upload Lab Result states
const [labFile, setLabFile] = useState(null);
const [testType, setTestType] = useState('');
const [patientEthAddress, setPatientEthAddress] = useState('');


  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const handleAddPatient = async () => {
    if (!patientAddress) {
      setAlertMessage('Please enter a valid Ethereum address');
      setAlertSeverity('error');
      setOpenAlert(true);
      return;
    }
    try {
      // placeholder for future contract call
      console.log("Adding patient:", patientAddress);

      setAlertMessage('Connection request sent to patient');
      setAlertSeverity('success');
      setOpenAlert(true);

      setPatientAddress(''); // clear input after success
    } catch (error) {
      console.error("Error adding patient:", error);
      setAlertMessage('Failed to send connection request');
      setAlertSeverity('error');
      setOpenAlert(true);
    }
  };

  const handleRequestAccess = async (patientAddress, testId) => {
    try {
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

      const tx = await contract.requestBatchAccess(patientAddress);
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

  const handlePublishResult = async () => {
    if (!labFile || !testType || !patientEthAddress) {
      setAlertMessage("Please fill all the fields before publishing.");
      setAlertSeverity("error");
      setOpenAlert(true);
      return;
    }

    try {
      // 1. Upload file to IPFS
      // Replace this with your actual IPFS upload logic
      // Example using web3.storage:
      // import { Web3Storage } from 'web3.storage'
      // const client = new Web3Storage({ token: 'YOUR_TOKEN' });
      // const cid = await client.put([labFile]);
      // For now, let's assume you have a function uploadToIPFS(file) that returns the CID:
      const ipfsCid = await uploadToIPFS(labFile); // <-- implement this function

      // 2. Encrypt file if needed, get encryptedSymmetricKey
      // For now, use empty string if not encrypting
      const encryptedSymmetricKey = "";

      // 3. Call smart contract
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );

      const tx = await contract.uploadLabResult(
        patientEthAddress,
        ipfsCid,
        testType,
        encryptedSymmetricKey
      );
      await tx.wait();

      setAlertMessage("Lab result published and permission request sent to patient!");
      setAlertSeverity("success");
      setOpenAlert(true);

      // Reset after publish
      setLabFile(null);
      setTestType('');
      setPatientEthAddress('');
    } catch (error) {
      console.error("Error publishing lab result:", error);
      setAlertMessage("Failed to publish lab result.");
      setAlertSeverity("error");
      setOpenAlert(true);
    }
  };

  const handleFileUploadSuccess = async (ipfsCid) => {
    if (!testType || !patientEthAddress) {
      setAlertMessage("Please fill all the fields before publishing.");
      setAlertSeverity("error");
      setOpenAlert(true);
      return;
    }

    try {
      const encryptedSymmetricKey = ""; // If not encrypting

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );

      const tx = await contract.uploadLabResult(
        patientEthAddress,
        ipfsCid,
        testType,
        encryptedSymmetricKey
      );
      await tx.wait();

      setAlertMessage("Lab result published and permission request sent to patient!");
      setAlertSeverity("success");
      setOpenAlert(true);

      setLabFile(null);
      setTestType('');
      setPatientEthAddress('');
    } catch (error) {
      console.error("Error publishing lab result:", error);
      setAlertMessage("Failed to publish lab result.");
      setAlertSeverity("error");
      setOpenAlert(true);
    }
  };




  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      {/* Top Navigation Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Laboratory Dashboard
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{
              backgroundColor: '#f44336',
              '&:hover': { backgroundColor: '#d32f2f' },
              borderRadius: '20px',
              px: 2,
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Add Patient" />
          <Tab label="Upload Lab Result" />
          <Tab label="Published Lab Results" />
        </Tabs>
      </Box>

      {/* Add Patient Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>

          {/* Input Field */}
          <TextField
            label="Patient Ethereum Address"
            variant="outlined"
            value={patientAddress}
            onChange={(e) => setPatientAddress(e.target.value)}
            sx={{
              width: '60%',  // Smaller input width
              mb: 2          // Space below the input
            }}
          />

          {/* ADD Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddPatient}
            sx={{
              width: '20%',        // Larger button width
              fontSize: '1.1rem',  // Bigger text
              py: 1.5              // Increase vertical padding
            }}
          >
            ADD
          </Button>
        </Box>
      </TabPanel>

      {/* Upload Lab Result Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            width: '100%',
            maxWidth: 600,
            mx: 'auto',
            mt: 2,
          }}
        >
          {/* File Upload Field */}
          <FileUploader
            onSuccess={handleFileUploadSuccess}
            onError={(err) => {
              setAlertMessage('Upload failed');
              setAlertSeverity('error');
              setOpenAlert(true);
            }}
            label="Upload Lab Result File"
            accept="application/pdf,image/*"
            maxSize={10 * 1024 * 1024} // 10 MB
          />
          {/* <Button
            variant="outlined"
            component="label"
            sx={{ width: '100%' }}
          >
            {labFile ? labFile.name : 'Choose Lab Result File'}
            <input
              type="file"
              hidden
              onChange={(e) => setLabFile(e.target.files[0])}
            />
          </Button> */}

          {/* Test Type Dropdown */}
          <TextField
            select
            label="Select Lab Test"
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            sx={{ width: '100%' }}
          >
            <MenuItem value="CBC">CBC Test</MenuItem>
            <MenuItem value="Lipid Profile">Lipid Profile</MenuItem>
            <MenuItem value="Blood Sugar">Blood Sugar Test</MenuItem>
            <MenuItem value="Thyroid">Thyroid Function Test</MenuItem>
          </TextField>

          {/* Ethereum Address Input */}
          <TextField
            label="Patient Ethereum Address"
            variant="outlined"
            value={patientEthAddress}
            onChange={(e) => setPatientEthAddress(e.target.value)}
            sx={{ width: '100%' }}
          />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setLabFile(null);
                setTestType('');
                setPatientEthAddress('');
              }}
              sx={{
                width: '120px',
                fontSize: '1rem',
                py: 1,
              }}
            >
              Clear
            </Button>

            {/* <Button
              variant="contained"
              color="primary"
              onClick={handlePublishResult}
              sx={{
                width: '120px',
                fontSize: '1rem',
                py: 1,
              }}
            >
              Publish
            </Button> */}
          </Box>
        </Box>
      </TabPanel>

      {/* Published Results Tab */}
      {/* <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Published Lab Results/Reports (All in one place)
        </Typography>
        {completedTests.map((test) => (
          <Box
            key={test.id}
            sx={{
              mb: 2,
              p: 2,
              border: '1px solid #ddd',
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <Typography>Patient: {test.patientAddress}</Typography>
            <Typography>Test Type: {test.testType}</Typography>
            <Typography>
              Completion Date:{' '}
              {new Date(test.completionDate * 1000).toLocaleDateString()}
            </Typography>
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
      </TabPanel> */}

      {/* File Upload Dialog */}
      <Dialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
      >
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
      <Dialog
        open={openDownloadDialog}
        onClose={() => setOpenDownloadDialog(false)}
      >
        <Box sx={{ p: 2 }}>
          <FileDownloader
            recordInfo={selectedTest}
            onClose={() => setOpenDownloadDialog(false)}
          />
        </Box>
      </Dialog>

      {/* Alert */}
      {openAlert && (
        <Alert
          severity={alertSeverity}
          onClose={() => setOpenAlert(false)}
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
        >
          {alertMessage}
        </Alert>
      )}
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default LabDashboard;
