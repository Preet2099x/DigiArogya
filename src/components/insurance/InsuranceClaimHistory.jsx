import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Collapse
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import contractService from '../../services/contractService';

const InsuranceClaimHistory = ({ patientAddress }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedClaim, setExpandedClaim] = useState(null);

  const fetchInsuranceClaims = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current user's address or use provided patientAddress
      await contractService.initialize();
      const userAddress = patientAddress || await contractService.signer.getAddress();
      
      console.log('Fetching insurance claims for address:', userAddress);

      // Use contract service to get claims with automatic fallback
      const fetchedClaims = await contractService.getInsuranceClaims(userAddress);
      
      console.log('Fetched claims:', fetchedClaims);

      // Filter claims to show only processed ones (Approved/Rejected)
      const processedClaims = fetchedClaims
        .filter(claim => claim.status === 'Approved' || claim.status === 'Rejected')
        .sort((a, b) => b.timestamp - a.timestamp); // Most recent first

      console.log('Processed claims:', processedClaims);
      setClaims(processedClaims);
    } catch (err) {
      console.error('Error fetching insurance claims:', err);
      setError(`Failed to fetch insurance claim history: ${err.message}`);
      setClaims([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsuranceClaims();
  }, [patientAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpandClaim = (claimId) => {
    setExpandedClaim(expandedClaim === claimId ? null : claimId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading insurance claim history...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (claims.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
          No processed insurance claims found in your health records.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AttachMoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
        Insurance Claims in Health Records
      </Typography>
      
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Claim ID</TableCell>
              <TableCell>Insurance Plan</TableCell>
              <TableCell>Amount (INR)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date Processed</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {claims.map((claim) => (
              <React.Fragment key={claim.claimId}>
                <TableRow>
                  <TableCell>
                    <Typography fontWeight="bold">#{claim.claimId}</Typography>
                  </TableCell>
                  <TableCell>{claim.plan}</TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">
                      ₹{claim.amount.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={claim.status}
                      color={getStatusColor(claim.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <CalendarIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      {format(new Date(claim.timestamp * 1000), 'MMM dd, yyyy')}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleExpandClaim(claim.claimId)}
                      size="small"
                    >
                      {expandedClaim === claim.claimId ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0 }}>
                    <Collapse in={expandedClaim === claim.claimId}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                              <DescriptionIcon sx={{ mr: 1, fontSize: 16 }} />
                              Claim Description
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {claim.description}
                            </Typography>
                            
                            {claim.ipfsHash && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Medical Documents
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  IPFS Hash: {claim.ipfsHash}
                                </Typography>
                              </Box>
                            )}
                            
                            <Box sx={{ mt: 2, p: 1, bgcolor: claim.status === 'Approved' ? 'success.light' : 'error.light', borderRadius: 1 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {claim.status === 'Approved' 
                                  ? '✅ Claim Approved - Payment will be processed according to your insurance policy terms.'
                                  : '❌ Claim Rejected - Please contact your insurance provider for more details.'
                                }
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InsuranceClaimHistory;
