import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import { ToastContainer } from "react-toastify";
import { Box, Card, Typography, Tabs, Tab, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, Chip } from '@mui/material';
import { Add } from '@mui/icons-material';
import FileUploader from './FileUploader';
import { ethers, BrowserProvider } from 'ethers';
import contractABI from '../contractABI.json';
import { format } from 'date-fns'; // Import date formatting utility

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

// Mapping of dataType enum to human-readable types
const dataTypeMap = {
  0: "EHR",          // Corresponds to EHR
  1: "PHR",          // Corresponds to PHR
  2: "Lab Results",  // Corresponds to LAB_RESULT
  3: "Prescription",  // Corresponds to PRESCRIPTION
  4: "Imaging",      // Corresponds to IMAGING
};

const PatientDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [healthRecords, setHealthRecords] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([
    {
      requestId: '0x789...',
      requester: '0xabc...',
      requestDate: '2024-03-12',
      status: 'PENDING',
      isIncentiveBased: true,
      incentiveAmount: '0.1 ETH',
    },
  ]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const navigate = useNavigate();

  // Define fetchHealthRecords function
  const fetchHealthRecords = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userPublicKey = await signer.getAddress();

      // Interact with the smart contract to fetch records
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

      // Fetch records using the user's address
      const records = await contract.getHealthRecordsByOwner(userPublicKey);

      // Update state with the fetched records directly from the blockchain
      const fetchedRecords = records.map((record) => ({
        ipfsCid: record.ipfsCid,
        dataType: dataTypeMap[record.dataType], // Map dataType enum to readable type
        provider: record.provider,
        timestamp: Number(record.timestamp), // Convert BigInt to Number
        isValid: record.isValid,
      }));

      // Reverse the records array to show the latest first
      setHealthRecords(fetchedRecords.reverse());
    } catch (error) {
      console.error("Error fetching health records:", error);
      alert('Error fetching health records. Please try again.');
    }
  };

  useEffect(() => {
    // Fetch health records from the blockchain when the component mounts
    fetchHealthRecords();
  }, []); // Run once when the component mounts

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleUploadDialog = (open) => {
    setOpenUploadDialog(open);
  };

  const handleNewRecord = (newRecord) => {
    // After uploading, refetch the health records
    setHealthRecords((prev) => [newRecord, ...prev]); // Add new record at the top
    handleUploadDialog(false); // Close the upload dialog

    // Re-fetch the updated records from the blockchain
    fetchHealthRecords();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100vw', overflowX: 'auto', p: 2, backgroundColor: '#f4f6f9' }}>
      <Box sx={{ p: 6, maxWidth: '1200px', mx: 'auto', backgroundColor: '#f4f6f9', borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold" color="primary">Patient Dashboard</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <div>
              <LogoutButton />
              <ToastContainer />
            </div>
          </Box>
        </Box>

        <Tabs value={tabValue} onChange={handleChange} centered sx={{ my: 4, borderBottom: 2, borderColor: 'divider' }}>
          <Tab label="Health Records" sx={{ fontWeight: 'bold', color: '#00796b', '&.Mui-selected': { color: '#004d40' } }} />
          <Tab label="Permission Requests" sx={{ fontWeight: 'bold', color: '#00796b', '&.Mui-selected': { color: '#004d40' } }} />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="bold" color="text.primary">My Health Records</Typography>
              <Button startIcon={<Add />} variant="contained" sx={{ backgroundColor: '#00796b' }} onClick={() => handleUploadDialog(true)}>
                Add PHR Data
              </Button>
            </Box>
            <TableContainer component={Card} sx={{ boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>IPFS CID</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {healthRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.dataType}</TableCell>
                      <TableCell>{record.provider}</TableCell>
                      <TableCell>
                        {record.timestamp
                          ? format(new Date(record.timestamp * 1000), 'MM/dd/yyyy')
                          : 'Invalid Date'}
                      </TableCell>{/* Format date properly */}
                      <TableCell>
                        <Chip label={record.isValid ? "Valid" : "Invalid"} color={record.isValid ? "success" : "error"} size="small" />
                      </TableCell>
                      <TableCell>
                        <a href={`https://ipfs.io/ipfs/${record.ipfsCid}`} target="_blank" rel="noopener noreferrer">
                          {record.ipfsCid}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Button variant="outlined" size="small" sx={{ color: '#00796b', borderColor: '#00796b' }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 1 && (
          <TableContainer component={Card} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Requester</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissionRequests.map((request) => (
                  <TableRow key={request.requestId}>
                    <TableCell>{request.requester}</TableCell>
                    <TableCell>{request.requestDate}</TableCell>
                    <TableCell>
                      {request.isIncentiveBased ? (
                        <Box display="flex" alignItems="center">
                          <Chip label={`${request.incentiveAmount}`} color="primary" size="small" />
                          <Typography ml={1}>Incentive-Based</Typography>
                        </Box>
                      ) : (
                        'Standard Access'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={request.status} color={request.status === 'PENDING' ? 'warning' : 'success'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Button variant="contained" size="small" sx={{ backgroundColor: '#00796b', mr: 1 }}>Approve</Button>
                      <Button variant="outlined" size="small" color="error">Decline</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={openUploadDialog} onClose={() => handleUploadDialog(false)}>
          <FileUploader
            onClose={() => handleUploadDialog(false)}
            onUpload={handleNewRecord}
          />
        </Dialog>
      </Box>
    </Box>
  );
};

export default PatientDashboard;
