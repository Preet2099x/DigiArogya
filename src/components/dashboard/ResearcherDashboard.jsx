import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../ui/LogoutButton';
import { ToastContainer } from "react-toastify";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  styled,
  createTheme,
  ThemeProvider
} from '@mui/material';
import { 
  UserCircle, 
  LogOut, 
  Search, 
  ChevronDown,
  Send,
  Eye 
} from 'lucide-react';

// Custom Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', 
      light: '#7986cb',
      dark: '#303f9f'
    },
    background: {
      default: '#f4f6f8', 
      paper: '#ffffff'
    },
    text: {
      primary: '#2c3e50', 
      secondary: '#7f8c8d' 
    }
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h6: {
      fontWeight: 600
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          transition: 'all 0.3s ease'
        }
      }
    }
  }
});

const StyledBadge = styled('span')(({ theme, status }) => ({
  padding: '6px 12px',
  borderRadius: '16px',
  fontSize: '0.875rem',
  fontWeight: 500,
  backgroundColor: status === 'Permitted' 
    ? 'rgba(46, 125, 50, 0.1)' 
    : status === 'Pending Permission' 
      ? 'rgba(255, 152, 0, 0.1)' 
      : 'rgba(244, 67, 54, 0.1)',
  color: status === 'Permitted' 
    ? '#2e7d32' 
    : status === 'Pending Permission' 
      ? '#f57c00' 
      : '#f44336',
  border: `1px solid ${
    status === 'Permitted' 
      ? 'rgba(46, 125, 50, 0.3)' 
      : status === 'Pending Permission' 
        ? 'rgba(255, 152, 0, 0.3)' 
        : 'rgba(244, 67, 54, 0.3)'
  }`,
  transition: 'all 0.3s ease'
}));

const ResearcherDashboard = () => {
  const [patients, setPatients] = useState([
    { 
      id: 1, 
      name: 'John Doe', 
      status: 'Not Permitted', 
      ethereumAddress: '0x1234...',
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      status: 'Permitted', 
      ethereumAddress: '0x5678...',
    },
  ]);

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [openPatientDetailDialog, setOpenPatientDetailDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [enteredEthereumAddress, setEnteredEthereumAddress] = useState('');
  const [permissionReason, setPermissionReason] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  
  const researcher = {
    name: 'Dr. Sarah Wilson',
    ethereumAddress: '0xRESEARCHER_ADDRESS',
    avatar: '/api/placeholder/32/32'
  };

  const filteredPatients = useMemo(() => 
    patients.filter(patient =>
      patient.ethereumAddress.toLowerCase().includes(searchTerm.toLowerCase())
    ), 
    [patients, searchTerm]
  );

  useEffect(() => {
    const resizeObserverErrorHandler = (event) => {
      if (event.target && event.target.readyState === 'complete') {
        console.warn('ResizeObserver error: Suppressing loop completed undelivered notifications');
      }
    };

    window.addEventListener('error', resizeObserverErrorHandler);

    return () => {
      window.removeEventListener('error', resizeObserverErrorHandler);
    };
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);

  };

  const handleCloseAddressDialog = () => {
    setOpenAddressDialog(false);
    setEnteredEthereumAddress('');
    setPermissionReason('');
  };

  const handleViewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setOpenPatientDetailDialog(true);
  };

  const handleSubmitAddressRequest = () => {
    const existingPatient = patients.find(
      (patient) => patient.ethereumAddress === enteredEthereumAddress
    );
    if (existingPatient) {
      setPatients(patients.map(patient => 
        patient.ethereumAddress === enteredEthereumAddress
          ? { ...patient, status: 'Pending Permission' }
          : patient
      ));
    } else {
      setPatients([
        ...patients,
        {
          id: patients.length + 1,
          name: 'Unknown',
          status: 'Pending Permission',
          ethereumAddress: enteredEthereumAddress,
          researchData: null,
        },
      ]);
    }
    handleCloseAddressDialog();
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        flexGrow: 1, 
        bgcolor: theme.palette.background.default, 
        minHeight: '100vh',
        color: theme.palette.text.primary 
      }}>
        {/* App Bar */}
        <AppBar 
          position="static" 
          color="default" 
          elevation={1} 
          sx={{ 
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}` 
          }}
        >
          <Container maxWidth="lg">
            <Toolbar>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ flexGrow: 1, fontWeight: 600, color: theme.palette.primary.main }}
              >
                Researcher Dashboard
              </Typography>
              
              {/* <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  border: `1px solid ${theme.palette.divider}`, 
                  borderRadius: '50px', 
                  p: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Avatar src={researcher.avatar} alt={researcher.name} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{researcher.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {researcher.ethereumAddress.slice(0, 10)}...
                  </Typography>
                </Box>
                <IconButton onClick={handleMenuOpen} size="small">
                  <ChevronDown size={20} />
                </IconButton>
              </Box> */}
              <div>
      {/* Render the logout button */}
      <LogoutButton />
      
      {/* ToastContainer to display toasts */}
      <ToastContainer />
    </div>


              {/* <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  elevation: 4,
                  sx: {
                    borderRadius: 2,
                    mt: 1
                  }
                }}
              >
                <MenuItem onClick={handleMenuClose}>
                  <UserCircle size={16} style={{ marginRight: 8 }} />
                  View Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogOut size={16} style={{ marginRight: 8 }} />
                  Logout
                </MenuItem>
              </Menu> */}
            </Toolbar>
          </Container>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Search Section */}
            <Card 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} color={theme.palette.text.secondary} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2
                    }
                  }}
                  size="small"
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  onClick={() => setOpenAddressDialog(true)}
                  sx={{ 
                    px: 3,
                    py: 1,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  Request Access by Ethereum Address
                </Button>
              </Box>
            </Card>

            {/* Patients Table */}
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                borderRadius: 2, 
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: theme.palette.background.default }}>
                  <TableRow>
                    {[ 'Ethereum Address', 'Status','Actions'].map((header) => (
                      <TableCell key={header} sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow 
                      key={patient.id} 
                      hover
                      sx={{ 
                        transition: 'background-color 0.3s ease',
                        '&:hover': { 
                          backgroundColor: theme.palette.action.hover 
                        } 
                      }}
                    >
                      {/* <TableCell>#{patient.id}</TableCell> */}
                      {/* <TableCell>{patient.name}</TableCell> */}
                      <TableCell>{patient.ethereumAddress}</TableCell>
                      <TableCell>
                        <StyledBadge status={patient.status}>
                          {patient.status}
                        </StyledBadge>
                      </TableCell>
                     
                      <TableCell>
                        <Button
                          variant="outlined"
                          startIcon={<Eye size={16} />}
                          size="small"
                          disabled={patient.status !== 'Permitted'}
                          onClick={() => handleViewPatientDetails(patient)}
                          sx={{ 
                            opacity: patient.status !== 'Permitted' ? 0.5 : 1,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          View Data
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Container>

        {/* Request by Ethereum Address Dialog */}
        <Dialog 
          open={openAddressDialog} 
          onClose={handleCloseAddressDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: 3,
              p: 1
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            Request Data Access by Ethereum Address
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Ethereum Address"
                value={enteredEthereumAddress}
                onChange={(e) => setEnteredEthereumAddress(e.target.value)}
                placeholder="Enter the Ethereum address of the patient"
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                label="Reason for Data Access"
                value={permissionReason}
                onChange={(e) => setPermissionReason(e.target.value)}
                placeholder="Explain the purpose of your research and why you need access to this patient's data"
                sx={{'& .MuiOutlinedInput-root': {borderRadius: 2}
}}

              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseAddressDialog} 
              color="inherit"
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAddressRequest} 
              variant="contained" 
              startIcon={<Send size={16} />}
              sx={{ 
                px: 3,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }
              }}
            >
              Send Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Patient Details Dialog */}
        <Dialog 
          open={openPatientDetailDialog} 
          onClose={() => setOpenPatientDetailDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: 3,
              p: 1
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            Patient Research Data Details
            {/* {selectedPatient && ` - ${selectedPatient.name}`} */}
          </DialogTitle>
          <DialogContent>
            {selectedPatient && selectedPatient.status === 'Permitted' && selectedPatient.researchData ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
               
              </Box>
            ) : (
              <Typography>No permitted research data available for this patient.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenPatientDetailDialog(false)}
              sx={{ 
                px: 3,
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default ResearcherDashboard;