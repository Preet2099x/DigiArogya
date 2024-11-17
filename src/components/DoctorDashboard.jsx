import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Button, 
  Tabs, 
  Tab, 
  TextField, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  Box, 
  Grid 
} from '@mui/material';
import { 
  Shield, 
  FileText, 
  Users, 
  Clock,
  Plus,
  Search,
  Upload 
} from 'lucide-react';

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box
    sx={{
      width: '100%',
      maxWidth: '100vw', 
      overflowX: 'auto', 
      p: 2, 
      backgroundColor: '#f4f6f9', 
    }} >
    <Box sx={{ p: 6, maxWidth: '1200px', mx: 'auto', gap: 6, background: '#f4f6f9', borderRadius: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold" color="primary">Doctor Dashboard</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Shield className="text-blue-500" />
          <Typography color="primary" fontWeight="bold">Verified Provider</Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#ffffff', boxShadow: 3, borderRadius: 2 }}>
            <CardHeader
              avatar={<Users fontSize="small" />}
              title="Total Patients"
              titleTypographyProps={{ variant: 'h5', fontWeight: 'bold', color: 'primary' }}
            />
            <CardContent>
              <Typography variant="h5" fontWeight="bold" color="primary">{patients.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#ffffff', boxShadow: 3, borderRadius: 2 }}>
            <CardHeader
              avatar={<FileText fontSize="small" />}
              title="Records Access"
              titleTypographyProps={{ variant: 'h5', fontWeight: 'bold', color: 'primary' }}
            />
            <CardContent>
              <Typography variant="h5" fontWeight="bold" color="primary">{accessibleRecords.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#ffffff', boxShadow: 3, borderRadius: 2 }}>
            <CardHeader
              avatar={<Clock fontSize="small" />}
              title="Pending Requests"
              titleTypographyProps={{ variant: 'h5', fontWeight: 'bold', color: 'primary' }}
            />
            <CardContent>
              <Typography variant="h5" fontWeight="bold" color="primary">2</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
              <TextField
                variant="outlined"
                size="small"
                placeholder="Search patients..."
                InputProps={{
                  startAdornment: (
                    <Search style={{ marginRight: '8px', color: '#999' }} />
                  ),
                }}
                sx={{ backgroundColor: 'white', borderRadius: 1 }}
              />
              <Button variant="contained" startIcon={<Plus />} sx={{ backgroundColor: '#00796b' }}>
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
                          <Typography variant="body2" color="success.main">{patient.status}</Typography>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Button variant="outlined" size="small" sx={{ marginRight: 1 }}>View Records</Button>
                          <Button variant="outlined" size="small">Request Access</Button>
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

      {tabValue === 2 && (
        <Card sx={{ marginTop: 4 }}>
          <CardContent>
            <Typography variant="h6" color="textSecondary">Upload Patient Records</Typography>
            <Box mt={2} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Patient Address"
                variant="outlined"
                placeholder="0x..."
                fullWidth
                sx={{ backgroundColor: 'white' }}
              />
              <FormControl fullWidth sx={{ backgroundColor: 'white' }}>
                <InputLabel>Record Type</InputLabel>
                <Select>
                  <MenuItem value="EHR">Electronic Health Record (EHR)</MenuItem>
                  <MenuItem value="LAB_RESULT">Lab Result</MenuItem>
                  <MenuItem value="PRESCRIPTION">Prescription</MenuItem>
                  <MenuItem value="IMAGING">Imaging</MenuItem>
                </Select>
              </FormControl>
              <Box display="flex" justifyContent="center" alignItems="center" border="1px dashed" borderRadius={1} p={4}>
                <Upload style={{ fontSize: '48px', color: '#00796b' }} />
                <Button variant="contained" component="label" sx={{ backgroundColor: '#004d40' }}>
                  Upload File
                  <input type="file" hidden />
                </Button>
              </Box>
              <Button variant="contained" startIcon={<Upload />} fullWidth sx={{ backgroundColor: '#00796b' }}>
                Upload Record
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
    </Box>
  );
};

export default DoctorDashboard;