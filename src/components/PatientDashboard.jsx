import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
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
  TextField,
  Grid,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Shield,
  Description,
  AccessTime,
  VerifiedUser,
  WarningAmber,
  Add,
  Key,
  BarChart,
} from '@mui/icons-material';

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
  const [selectedFile, setSelectedFile] = useState(null);

  const navigate = useNavigate();

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    console.log('User logged out');
    alert('Logged out successfully!');
    navigate('/');
  };

  const handleUploadDialog = (open) => {
    setOpenUploadDialog(open);
    if (!open) setSelectedFile(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleFileUpload = () => {
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    console.log('File uploaded:', selectedFile.name);

    // Add the uploaded file to health records
    setHealthRecords((prev) => [
      ...prev,
      {
        dataHash: '0x' + Math.random().toString(16).substr(2, 8),
        dataType: 'Uploaded File',
        timestamp: new Date().toISOString().split('T')[0],
        provider: 'Self',
        isValid: true,
      },
    ]);

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
            <Box display="flex" alignItems="center" color="success.main">
              <Avatar sx={{ bgcolor: 'success.main', color: 'white', mr: 1 }}>
                <Shield />
              </Avatar>
              <Typography fontWeight="bold" color="text.primary">
                Verified Patient
              </Typography>
            </Box>
            <Button variant="outlined" color="error" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>

        {/* Cards for summary */}
        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={4} mb={4}>
          <Card sx={{ backgroundColor: '#ffffff', boxShadow: 3, borderRadius: 2 }}>
            <CardHeader
              avatar={<Description color="disabled" />}
              title="Total Records"
              titleTypographyProps={{ variant: 'h5', fontWeight: 'bold' }}
            />
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {healthRecords.length}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ backgroundColor: '#ffffff', boxShadow: 3, borderRadius: 2 }}>
            <CardHeader
              avatar={<AccessTime color="disabled" />}
              title="Pending Requests"
              titleTypographyProps={{ variant: 'h5', fontWeight: 'bold' }}
            />
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {permissionRequests.filter((r) => r.status === 'PENDING').length}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ backgroundColor: '#ffffff', boxShadow: 3, borderRadius: 2 }}>
            <CardHeader
              avatar={<Key color="disabled" />}
              title="Active Permissions"
              titleTypographyProps={{ variant: 'h5', fontWeight: 'bold' }}
            />
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="primary">
                5
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Tabs for navigation */}
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
          <Tab
            label="Emergency Access"
            sx={{ fontWeight: 'bold', color: '#00796b', '&.Mui-selected': { color: '#004d40' } }}
          />
          <Tab
            label="Analytics"
            sx={{ fontWeight: 'bold', color: '#00796b', '&.Mui-selected': { color: '#004d40' } }}
          />
        </Tabs>

        {/* Tab Content */}
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
                        {record.isValid ? (
                          <Chip label="Valid" color="success" size="small" />
                        ) : (
                          <Chip label="Invalid" color="error" size="small" />
                        )}
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

        {/* Permission Requests */}
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

        {/* Placeholder content for tabs */}
        {tabValue === 2 && <Typography variant="h6">Emergency Access is currently disabled.</Typography>}
        {tabValue === 3 && <Typography variant="h6">Analytics is currently under development.</Typography>}

        {/* Upload Dialog */}
        <Dialog open={openUploadDialog} onClose={() => handleUploadDialog(false)}>
          <DialogTitle>Upload Personal Health Record</DialogTitle>
          <DialogContent>
            <TextField type="file" onChange={handleFileChange} fullWidth />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleFileUpload} variant="contained" color="primary">
              Upload
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default PatientDashboard;
