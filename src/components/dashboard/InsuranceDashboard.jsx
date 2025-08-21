import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Button, Card, CardContent, Chip,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Alert, Snackbar, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import contractService from "../../services/contractService";
import FileDownloader from '../files/FileDownloader';
import InsuranceDebugPanel from '../debug/InsuranceDebugPanel';

const InsuranceDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [allClaims, setAllClaims] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [approvedClaims, setApprovedClaims] = useState([]);
  const [rejectedClaims, setRejectedClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [rejectionDialog, setRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [documentDialog, setDocumentDialog] = useState(false);
  const [selectedClaimForDocs, setSelectedClaimForDocs] = useState(null);
  const [insurancePrivateKey, setInsurancePrivateKey] = useState('');

  // Load insurance claims from blockchain
  const loadInsuranceClaims = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Loading insurance claims...');

  // Always show all claims for simplicity
  const claims = await contractService.getAllInsuranceClaims();
  console.log('Fetched all claims:', claims);

      // Add additional display properties
      const processedClaims = claims.map((claim) => ({
        ...claim,
        patientName: `Patient ${(claim.patient?.substring(2, 8) || 'Unknown')?.toUpperCase()}`,
        hospitalName: claim.insuranceCompany || "General Hospital",
        diagnosis: (claim.description || 'No description').substring(0, 50) + "..."
      }));

      setAllClaims(processedClaims);
      setPendingClaims(processedClaims.filter(claim => claim.status === 'Pending'));
      setApprovedClaims(processedClaims.filter(claim => claim.status === 'Approved'));
      setRejectedClaims(processedClaims.filter(claim => claim.status === 'Rejected'));

    } catch (error) {
      console.error('Error loading claims:', error);
      setAlertMessage(`Error loading insurance claims: ${error.message}`);
      setAlertSeverity('error');
      setOpenAlert(true);
      // Set empty arrays as fallback
      setAllClaims([]);
      setPendingClaims([]);
      setApprovedClaims([]);
      setRejectedClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve a claim
  const handleApproveClaim = async (claim) => {
    try {
      setLoading(true);
      
      console.log('Approving claim:', claim.claimId);

      // First validate the claim can be processed
      if (!claim || !claim.claimId) {
        throw new Error('Invalid claim data');
      }

      if (claim.status !== 'Pending') {
        throw new Error(`Claim is already ${claim.status}. Only pending claims can be processed.`);
      }

      // Use contract service for approval with fallback
      const result = await contractService.processInsuranceClaim(claim.claimId, true);
      
      setAlertMessage('Approving claim... Please wait for confirmation.');
      setAlertSeverity('info');
      setOpenAlert(true);

      // Wait for transaction confirmation if it's a transaction
      if (result && result.wait) {
        await result.wait();
      }

      setAlertMessage(`✅ Claim #${claim.claimId} approved successfully!`);
      setAlertSeverity('success');
      setOpenAlert(true);

      // Refresh claims
      await loadInsuranceClaims();

    } catch (error) {
      console.error('Error approving claim:', error);
      
      let errorMessage = 'Error approving claim: ';
      
      if (error.message.includes('missing revert data')) {
        errorMessage += 'Transaction failed. This usually means the claim ID doesn\'t exist or cannot be processed. Please refresh and try again.';
      } else if (error.message.includes('Invalid claim ID')) {
        errorMessage += 'Invalid claim ID. The claim may have been removed or doesn\'t exist.';
      } else if (error.message.includes('Claim not found')) {
        errorMessage += 'Claim not found in the blockchain. Please refresh and try again.';
      } else if (error.message.includes('user rejected')) {
        errorMessage += 'Transaction was cancelled by user.';
      } else {
        errorMessage += error.message;
      }
      
      setAlertMessage(errorMessage);
      setAlertSeverity('error');
      setOpenAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Reject a claim
  const handleRejectClaim = async () => {
    if (!selectedClaim || !rejectionReason.trim()) {
      setAlertMessage('Please provide a rejection reason');
      setAlertSeverity('warning');
      setOpenAlert(true);
      return;
    }

    try {
      setLoading(true);
      
      console.log('Rejecting claim:', selectedClaim.claimId, 'Reason:', rejectionReason);

      // First validate the claim can be processed
      if (selectedClaim.status !== 'Pending') {
        throw new Error(`Claim is already ${selectedClaim.status}. Only pending claims can be processed.`);
      }

      // Use contract service for rejection with fallback
      const result = await contractService.processInsuranceClaim(selectedClaim.claimId, false);
      
      setAlertMessage('Rejecting claim... Please wait for confirmation.');
      setAlertSeverity('info');
      setOpenAlert(true);

      // Wait for transaction confirmation if it's a transaction
      if (result && result.wait) {
        await result.wait();
      }

      setAlertMessage(`❌ Claim #${selectedClaim.claimId} rejected successfully!`);
      setAlertSeverity('success');
      setOpenAlert(true);

      // Reset and close dialog
      setRejectionDialog(false);
      setRejectionReason('');
      setSelectedClaim(null);

      // Refresh claims
      await loadInsuranceClaims();

    } catch (error) {
      console.error('Error rejecting claim:', error);
      
      let errorMessage = 'Error rejecting claim: ';
      
      if (error.message.includes('missing revert data')) {
        errorMessage += 'Transaction failed. This usually means the claim ID doesn\'t exist or cannot be processed. Please refresh and try again.';
      } else if (error.message.includes('Invalid claim ID')) {
        errorMessage += 'Invalid claim ID. The claim may have been removed or doesn\'t exist.';
      } else if (error.message.includes('Claim not found')) {
        errorMessage += 'Claim not found in the blockchain. Please refresh and try again.';
      } else if (error.message.includes('user rejected')) {
        errorMessage += 'Transaction was cancelled by user.';
      } else {
        errorMessage += error.message;
      }
      
      setAlertMessage(errorMessage);
      setAlertSeverity('error');
      setOpenAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle document viewing with decryption
  const handleViewDocuments = (claim) => {
    setSelectedClaimForDocs(claim);
    setDocumentDialog(true);
  };

  useEffect(() => {
    loadInsuranceClaims();
    
    // auto-refresh every 30 seconds
    const autoRefresh = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadInsuranceClaims();
      }
    }, 30000);

    return () => {
      clearInterval(autoRefresh);
    };
  }, [loadInsuranceClaims]);

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const renderClaimsTable = (claims, showActions = false) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Claim ID</TableCell>
            <TableCell>Patient</TableCell>
            <TableCell>Hospital</TableCell>
            <TableCell>Diagnosis</TableCell>
            <TableCell>Amount (INR)</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            {showActions && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {claims.map((claim) => (
            <TableRow key={claim.claimId}>
              <TableCell>#{claim.claimId}</TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {claim.patientName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {claim.patient.substring(0, 10)}...
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>{claim.hospitalName}</TableCell>
              <TableCell>{claim.diagnosis}</TableCell>
              <TableCell>₹{claim.amount.toLocaleString()}</TableCell>
              <TableCell>{formatDate(claim.timestamp)}</TableCell>
              <TableCell>
                <Chip 
                  label={claim.status} 
                  color={getStatusColor(claim.status)}
                  size="small"
                />
                {claim.status === 'REJECTED' && claim.rejectionReason && (
                  <Typography variant="caption" display="block" color="error">
                    {claim.rejectionReason}
                  </Typography>
                )}
              </TableCell>
              {showActions && (
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleApproveClaim(claim)}
                        disabled={loading}
                        title={loading ? "Please wait..." : ""}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          setSelectedClaim(claim);
                          setRejectionDialog(true);
                        }}
                        disabled={loading}
                        title={loading ? "Please wait..." : ""}
                      >
                        Reject
                      </Button>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setDocumentDialog(true);
                        setSelectedClaimForDocs(claim);
                      }}
                    >
                      View
                    </Button>
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
          {claims.length === 0 && (
            <TableRow>
              <TableCell colSpan={showActions ? 8 : 7} align="center">
                <Typography variant="body2" color="text.secondary">
                  No claims found
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          Insurance Claims Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Registration button removed */}
          <Button
            variant="contained"
            color="error"
            onClick={() => {/* Add logout functionality */}}
            sx={{ textTransform: 'uppercase' }}
          >
            LOGOUT
          </Button>
        </Box>
      </Box>

  {/* Registration warning removed */}

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                {allClaims.length}
              </Typography>
              <Box>
                <Typography variant="h6" sx={{ color: '#1976d2' }}>
                  Total Requests
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  All insurance claims
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ bgcolor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                {pendingClaims.length}
              </Typography>
              <Box>
                <Typography variant="h6" sx={{ color: '#f57c00' }}>
                  Pending
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Awaiting review
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ bgcolor: '#e8f5e8', borderLeft: '4px solid #4caf50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                {approvedClaims.length}
              </Typography>
              <Box>
                <Typography variant="h6" sx={{ color: '#388e3c' }}>
                  Approved
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Successfully processed
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ bgcolor: '#ffebee', borderLeft: '4px solid #f44336' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                {rejectedClaims.length}
              </Typography>
              <Box>
                <Typography variant="h6" sx={{ color: '#d32f2f' }}>
                  Rejected
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Declined claims
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'uppercase',
              fontWeight: 'bold',
            }
          }}
        >
          <Tab label="Total Requests" />
          <Tab label="Pending Requests" />
          <Tab label="Approved Requests" />
          <Tab label="Rejected Requests" />
          <Tab label="🔧 Debug Panel" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Card>
        <CardContent>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                All Insurance Claims ({allClaims.length})
              </Typography>
              {renderClaimsTable(allClaims)}
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Pending Claims ({pendingClaims.length})
              </Typography>
              {renderClaimsTable(pendingClaims, true)}
            </Box>
          )}
          
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Approved Claims ({approvedClaims.length})
              </Typography>
              {renderClaimsTable(approvedClaims)}
            </Box>
          )}
          
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Rejected Claims ({rejectedClaims.length})
              </Typography>
              {renderClaimsTable(rejectedClaims)}
            </Box>
          )}
          
          {activeTab === 4 && (
            <Box>
              <InsuranceDebugPanel />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog} onClose={() => setRejectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Claim #{selectedClaim?.claimId}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Patient: {selectedClaim?.patientName}<br/>
              Hospital: {selectedClaim?.hospitalName}<br/>
              Diagnosis: {selectedClaim?.diagnosis}<br/>
              Amount: {selectedClaim?.claimAmount} ETH
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Rejection Reason *"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a detailed reason for rejecting this claim..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRejectClaim} 
            variant="contained" 
            color="error"
            disabled={!rejectionReason.trim() || loading}
          >
            {loading ? 'Rejecting...' : 'Reject Claim'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Dialog */}
      <Dialog open={documentDialog} onClose={() => setDocumentDialog(false)}>
        <DialogTitle sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          <span role="img" aria-label="insurance">📄</span> View Claim Document #{selectedClaimForDocs?.claimId}
        </DialogTitle>
        <DialogContent>
          <FileDownloader
            onClose={() => setDocumentDialog(false)}
            ipfsHash={selectedClaimForDocs?.ipfsHash}
            encryptedSymmetricKey={selectedClaimForDocs?.encryptedSymmetricKey}
            recordInfo={{ ipfsCid: selectedClaimForDocs?.ipfsHash, encryptedSymmetricKey: selectedClaimForDocs?.encryptedSymmetricKey }}
            privateKeyLabel="Insurance Private Key"
          />
        </DialogContent>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={openAlert}
        autoHideDuration={6000}
        onClose={() => setOpenAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setOpenAlert(false)} severity={alertSeverity}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InsuranceDashboard;