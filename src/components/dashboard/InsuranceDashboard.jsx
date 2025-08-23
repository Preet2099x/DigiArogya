import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, 
  Typography, 
  Button, 
  Dialog, 
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  Check as CheckIcon, 
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  AccountBalanceWallet,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { BrowserProvider, ethers } from 'ethers';
import contractABI from '../../contractABI.json';
import LogoutButton from '../ui/LogoutButton';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const InsuranceDashboard = () => {
  const [claimRequests, setClaimRequests] = useState([]);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [loading, setLoading] = useState(false);

  // Convert status number to text
  const getStatusText = (status) => {
    switch (Number(status)) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      default: return 'Unknown';
    }
  };

  // Fetch all insurance claims from blockchain
  const fetchAllClaims = useCallback(async () => {
    try {
      setLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      
      // Get all claims (only insurance providers can call this)
      const claims = await contract.getAllInsuranceClaims();
      
      const formattedClaims = claims.map((claim) => ({
        id: claim.claimId,
        patientName: claim.claimant.slice(0, 6) + '...' + claim.claimant.slice(-4), // Shortened address as name
        patientAddress: claim.claimant,
        provider: claim.insuranceProvider,
        plan: claim.insurancePlan,
        hospital: claim.hospitalName,
        amount: ethers.formatEther(claim.claimAmount),
        approvedAmount: ethers.formatEther(claim.approvedAmount),
        status: getStatusText(claim.status),
        date: new Date(Number(claim.submissionDate) * 1000).toLocaleDateString(),
        diagnosis: claim.diagnosis,
        medicalReportHash: claim.medicalReportHash,
        rejectionReason: claim.rejectionReason
      }));
      
      setClaimRequests(formattedClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      setAlertMessage('Error fetching claims. Please ensure you are connected with an insurance provider account.');
      setAlertSeverity('error');
      setOpenAlert(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load claims on component mount
  useEffect(() => {
    fetchAllClaims();
  }, [fetchAllClaims]);

  // Calculate summary statistics
  const totalRequests = claimRequests.length;
  const pendingRequests = claimRequests.filter(claim => claim.status === 'Pending').length;
  const approvedRequests = claimRequests.filter(claim => claim.status === 'Approved').length;
  const rejectedRequests = claimRequests.filter(claim => claim.status === 'Rejected').length;

  const handleViewClaim = (claim) => {
    setSelectedClaim(claim);
    setOpenViewDialog(true);
  };

  const handleApproveClaim = (claim) => {
    setSelectedClaim(claim);
    setApprovedAmount(claim.amount); // Pre-fill with requested amount
    setOpenApproveDialog(true);
  };

  const handleRejectClaim = (claim) => {
    setSelectedClaim(claim);
    setRejectReason('');
    setOpenRejectDialog(true);
  };

  const confirmApprove = async () => {
    try {
      setLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      
      const approvedAmountWei = ethers.parseEther(approvedAmount);
      
      // Call the smart contract function to approve the claim
      const tx = await contract.approveInsuranceClaim(
        selectedClaim.id,
        approvedAmountWei
      );
      
      setAlertMessage('Transaction submitted! Waiting for confirmation...');
      setAlertSeverity('info');
      setOpenAlert(true);
      
      // Wait for transaction confirmation
      await tx.wait();
      
      setAlertMessage('Claim approved successfully');
      setAlertSeverity('success');
      setOpenAlert(true);
      setOpenApproveDialog(false);
      
      // Refresh claims list
      fetchAllClaims();
    } catch (error) {
      console.error("Error approving claim:", error);
      setAlertMessage('Failed to approve claim. Please try again.');
      setAlertSeverity('error');
      setOpenAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const confirmReject = async () => {
    try {
      setLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      
      // Call the smart contract function to reject the claim
      const tx = await contract.rejectInsuranceClaim(
        selectedClaim.id,
        rejectReason
      );
      
      setAlertMessage('Transaction submitted! Waiting for confirmation...');
      setAlertSeverity('info');
      setOpenAlert(true);
      
      // Wait for transaction confirmation
      await tx.wait();
      
      setAlertMessage('Claim rejected successfully');
      setAlertSeverity('success');
      setOpenAlert(true);
      setOpenRejectDialog(false);
      
      // Refresh claims list
      fetchAllClaims();
    } catch (error) {
      console.error("Error rejecting claim:", error);
      setAlertMessage('Failed to reject claim. Please try again.');
      setAlertSeverity('error');
      setOpenAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ 
      width: "100%", 
      maxWidth: "100vw", 
      overflowX: "auto", 
      p: 2, 
      backgroundColor: "#f5f7fa",
      minHeight: '100vh'
    }}>
      <Box sx={{ 
        p: 4, 
        maxWidth: "1200px", 
        mx: "auto", 
        backgroundColor: "#f5f7fa", 
        borderRadius: 2 
      }}>
        {/* Header Section */}
        <Box sx={{
          backgroundColor: 'white',
          borderRadius: 2,
          p: 3,
          mb: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #1976d2'
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <AccountBalanceWallet sx={{ fontSize: 32, color: '#1976d2' }} />
              <Box>
                <Typography variant="h4" fontWeight="600" color="primary">
                  Insurance Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Review and process insurance claims from patients
                </Typography>
              </Box>
            </Box>
            <LogoutButton />
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              textAlign: 'center', 
              backgroundColor: '#e3f2fd',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
                  {totalRequests}
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight="600">
                  Total Requests
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All insurance claims
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              textAlign: 'center', 
              backgroundColor: '#fff3e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ color: '#f57c00', fontWeight: 'bold', mb: 1 }}>
                  {pendingRequests}
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight="600">
                  Pending Review
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Awaiting approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              textAlign: 'center', 
              backgroundColor: '#e8f5e8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ color: '#388e3c', fontWeight: 'bold', mb: 1 }}>
                  {approvedRequests}
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight="600">
                  Approved
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Successfully processed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              textAlign: 'center', 
              backgroundColor: '#ffebee',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ color: '#d32f2f', fontWeight: 'bold', mb: 1 }}>
                  {rejectedRequests}
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight="600">
                  Rejected
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Claims declined
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Claims Table Section */}
        <Box sx={{
          backgroundColor: 'white',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{
            borderBottom: '1px solid #e0e0e0',
            p: 3
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <AccountBalanceWallet sx={{ fontSize: 28, color: '#1976d2' }} />
                <Box>
                  <Typography variant="h5" fontWeight="600" color="primary">
                    Insurance Claims
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Review and process patient insurance claims
                  </Typography>
                </Box>
              </Box>
              <Button 
                startIcon={<RefreshIcon />}
                variant="outlined" 
                onClick={fetchAllClaims}
                disabled={loading}
                sx={{
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    borderColor: '#1565c0',
                    backgroundColor: '#f3f4f6'
                  }
                }}
              >
                {loading ? 'Loading...' : 'Refresh Claims'}
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <TableContainer component={Paper} sx={{ 
              boxShadow: 'none',
              border: '1px solid #e0e0e0',
              borderRadius: 2
            }}>
              <Table>
                <TableHead>
                  <TableRow sx={{
                    backgroundColor: '#f5f5f5',
                    '& .MuiTableCell-head': {
                      fontWeight: 600,
                      color: '#333',
                      fontSize: '0.95rem'
                    }
                  }}>
                    <TableCell>Claim ID</TableCell>
                    <TableCell>Patient Address</TableCell>
                    <TableCell>Provider & Plan</TableCell>
                    <TableCell>Hospital</TableCell>
                    <TableCell>Claim Amount (ETH)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {claimRequests.map((claim) => (
                    <TableRow 
                      key={claim.id} 
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f9f9f9'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>{claim.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {claim.patientAddress.slice(0, 6)}...{claim.patientAddress.slice(-4)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="500">{claim.provider}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {claim.plan}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{claim.hospital}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {claim.amount} ETH
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={claim.status} 
                          color={getStatusColor(claim.status)}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleViewClaim(claim)}
                            size="small"
                            sx={{
                              '&:hover': {
                                backgroundColor: '#e3f2fd'
                              }
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          {claim.status === 'Pending' && (
                            <>
                              <IconButton 
                                color="success" 
                                onClick={() => handleApproveClaim(claim)}
                                size="small"
                                disabled={loading}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: '#e8f5e8'
                                  }
                                }}
                              >
                                <CheckIcon />
                              </IconButton>
                              <IconButton 
                                color="error" 
                                onClick={() => handleRejectClaim(claim)}
                                size="small"
                                disabled={loading}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: '#ffebee'
                                  }
                                }}
                              >
                                <CloseIcon />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {claimRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No insurance claims found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Claims will appear here when patients submit them
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>

        {/* View Claim Dialog */}
        <Dialog 
          open={openViewDialog} 
          onClose={() => setOpenViewDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: '#1976d2',
            color: 'white',
            p: 3
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <AccountBalanceWallet sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" fontWeight="600">Claim Details</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Review complete claim information
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {selectedClaim && (
              <Card sx={{ 
                backgroundColor: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                p: 3
              }}>
                <Grid container spacing={3} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Claim ID</Typography>
                    <Typography variant="body1" fontWeight="500">{selectedClaim.id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Patient Address</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {selectedClaim.patientAddress}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Provider</Typography>
                    <Typography variant="body1" fontWeight="500">{selectedClaim.provider}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Plan</Typography>
                    <Typography variant="body1" fontWeight="500">{selectedClaim.plan}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Hospital</Typography>
                    <Typography variant="body1" fontWeight="500">{selectedClaim.hospital}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Claim Amount</Typography>
                    <Typography variant="body1" fontWeight="500" color="primary">{selectedClaim.amount} ETH</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Submission Date</Typography>
                    <Typography variant="body1" fontWeight="500">{selectedClaim.date}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Status</Typography>
                    <Chip 
                      label={selectedClaim.status} 
                      color={getStatusColor(selectedClaim.status)}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </Grid>
                  {selectedClaim.status === 'Approved' && (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Approved Amount</Typography>
                      <Typography variant="body1" fontWeight="500" color="success.main">{selectedClaim.approvedAmount} ETH</Typography>
                    </Grid>
                  )}
                  {selectedClaim.status === 'Rejected' && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Rejection Reason</Typography>
                      <Typography variant="body1" sx={{ backgroundColor: '#ffebee', p: 2, borderRadius: 1, mt: 1 }}>
                        {selectedClaim.rejectionReason}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Diagnosis</Typography>
                    <Typography variant="body1" sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mt: 1 }}>
                      {selectedClaim.diagnosis}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="600">Medical Report Hash</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mt: 1 }}>
                      {selectedClaim.medicalReportHash}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            )}
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            backgroundColor: '#f5f5f5',
            borderTop: '1px solid #e0e0e0'
          }}>
            <Button onClick={() => setOpenViewDialog(false)} variant="outlined">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Approve Claim Dialog */}
        <Dialog 
          open={openApproveDialog} 
          onClose={() => setOpenApproveDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: '#388e3c',
            color: 'white',
            p: 3
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <CheckIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" fontWeight="600">Approve Claim</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Confirm claim approval and set approved amount
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Card sx={{ 
              backgroundColor: '#e8f5e8',
              borderRadius: 2,
              p: 3,
              mb: 3
            }}>
              <Typography gutterBottom fontWeight="600">
                Are you sure you want to approve claim {selectedClaim?.id}?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This action will process the insurance claim and cannot be undone.
              </Typography>
            </Card>
            <TextField
              fullWidth
              label="Approved Amount (ETH)"
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(e.target.value)}
              type="number"
              inputProps={{ min: 0, step: 0.001 }}
              helperText={`Requested amount: ${selectedClaim?.amount} ETH`}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#388e3c',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#388e3c',
                  },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            backgroundColor: '#f5f5f5',
            borderTop: '1px solid #e0e0e0',
            gap: 2
          }}>
            <Button onClick={() => setOpenApproveDialog(false)} disabled={loading} variant="outlined">
              Cancel
            </Button>
            <Button 
              onClick={confirmApprove} 
              variant="contained" 
              sx={{ backgroundColor: '#388e3c', '&:hover': { backgroundColor: '#2e7d2e' } }}
              disabled={!approvedAmount || loading}
            >
              {loading ? 'Processing...' : 'Approve Claim'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reject Claim Dialog */}
        <Dialog 
          open={openRejectDialog} 
          onClose={() => setOpenRejectDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: '#d32f2f',
            color: 'white',
            p: 3
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <CloseIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" fontWeight="600">Reject Claim</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Provide reason for claim rejection
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Card sx={{ 
              backgroundColor: '#ffebee',
              borderRadius: 2,
              p: 3,
              mb: 3
            }}>
              <Typography gutterBottom fontWeight="600">
                Are you sure you want to reject claim {selectedClaim?.id}?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please provide a detailed reason for rejecting this claim.
              </Typography>
            </Card>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason for rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              placeholder="Please provide a detailed explanation for the rejection..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#d32f2f',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#d32f2f',
                  },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            backgroundColor: '#f5f5f5',
            borderTop: '1px solid #e0e0e0',
            gap: 2
          }}>
            <Button onClick={() => setOpenRejectDialog(false)} disabled={loading} variant="outlined">
              Cancel
            </Button>
            <Button 
              onClick={confirmReject} 
              variant="contained" 
              sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#c62828' } }}
              disabled={!rejectReason.trim() || loading}
            >
              {loading ? 'Processing...' : 'Reject Claim'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Alert Snackbar */}
        {openAlert && (
          <Alert
            severity={alertSeverity}
            onClose={() => setOpenAlert(false)}
            sx={{ 
              position: 'fixed', 
              bottom: 16, 
              right: 16,
              zIndex: 9999,
              borderRadius: 2,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
            }}
          >
            {alertMessage}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default InsuranceDashboard;