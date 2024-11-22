import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import { ToastContainer } from "react-toastify";
import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  Chip
} from '@mui/material';
import { Add } from '@mui/icons-material';
import FileUploader from './FileUploader';

const PatientDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [healthRecords, setHealthRecords] = useState([
    { dataHash: '0x123...', dataType: 'EHR', timestamp: '2024-03-13', provider: '0x456...', isValid: true },
  ]);
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

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleUploadDialog = (open) => {
    setOpenUploadDialog(open);
  };

  const handleNewRecord = (newRecord) => {
    setHealthRecords((prev) => [...prev, newRecord]);
    handleUploadDialog(false);
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
      <Box sx={{ p: 6, maxWidth: '1200px', mx: 'auto', backgroundColor: '#f4f6f9', borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Patient Dashboard
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <div>
              <LogoutButton />
              <ToastContainer />
            </div>
          </Box>
        </Box>

        <Tabs
          value={tabValue}
          onChange={handleChange}
          centered
          sx={{ my: 4, borderBottom: 2, borderColor: 'divider' }}
        >
          <Tab
            label="Health Records"
            sx={{ fontWeight: 'bold', color: '#00796b', '&.Mui-selected': { color: '#004d40' } }}
          />
          <Tab
            label="Permission Requests"
            sx={{ fontWeight: 'bold', color: '#00796b', '&.Mui-selected': { color: '#004d40' } }}
          />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                My Health Records
              </Typography>
              <Button
                startIcon={<Add />}
                variant="contained"
                sx={{ backgroundColor: '#00796b' }}
                onClick={() => handleUploadDialog(true)}
              >
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
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {healthRecords.map((record) => (
                    <TableRow key={record.dataHash}>
                      <TableCell>{record.dataType}</TableCell>
                      <TableCell>{record.provider}</TableCell>
                      <TableCell>{record.timestamp}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.isValid ? "Valid" : "Invalid"}
                          color={record.isValid ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ color: '#00796b', borderColor: '#00796b' }}
                        >
                          View
                        </Button>
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
                      <Chip
                        label={request.status}
                        color={request.status === 'PENDING' ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ backgroundColor: '#00796b', mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button variant="outlined" size="small" color="error">
                        Decline
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog
          open={openUploadDialog}
          onClose={() => handleUploadDialog(false)}
          maxWidth="md"
          fullWidth
        >
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