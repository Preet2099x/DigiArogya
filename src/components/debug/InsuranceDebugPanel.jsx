import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider 
} from '@mui/material';
import contractService from '../../services/contractService';

const InsuranceDebugPanel = () => {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [error, setError] = useState('');

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Starting insurance claims diagnostics...');
      
      // Initialize connection
      await contractService.initialize();
      
      const info = {
        timestamp: new Date().toLocaleString(),
        claims: [],
        nextClaimId: null,
        contractConnected: false,
        errors: []
      };

      try {
        // Get all claims
        const allClaims = await contractService.getAllInsuranceClaims();
        info.claims = allClaims.map(claim => ({
          id: claim.claimId?.toString() || 'N/A',
          patient: claim.patient || 'N/A',
          status: claim.status || 'Unknown',
          amount: claim.amount ? `${(Number(claim.amount) / 1e18).toFixed(4)} ETH` : 'N/A',
          description: claim.description || 'No description',
          canProcess: claim.status === 'Pending'
        }));
        
        console.log(`✅ Found ${allClaims.length} claims`);
        info.contractConnected = true;
        
      } catch (claimsError) {
        console.error('❌ Error fetching claims:', claimsError);
        info.errors.push(`Claims fetch error: ${claimsError.message}`);
      }

      // Try to get next claim ID (this might fail if we don't have direct access)
      try {
        // This is a workaround since we don't have direct access to nextClaimId
        info.nextClaimId = info.claims.length > 0 
          ? Math.max(...info.claims.map(c => parseInt(c.id) || 0)) + 1 
          : 1;
      } catch (nextIdError) {
        info.errors.push(`Next ID calculation error: ${nextIdError.message}`);
      }

      setDebugInfo(info);
      
    } catch (error) {
      console.error('🔥 Diagnostics error:', error);
      setError(`Diagnostics failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestClaim = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🧪 Creating test claim...');
      
      // Get current user address
      await contractService.initialize();
      const signer = await contractService.signer.getAddress();
      
      // Create a test claim
      const result = await contractService.addInsuranceClaim(
        signer, // Use current user as patient
        'Test Insurance Plan - Debug',
        '0.001', // 0.001 ETH
        'Test claim created for debugging purposes',
        'QmTestDebugHash123'
      );
      
      console.log('✅ Test claim created:', result);
      
      // Refresh diagnostics
      await runDiagnostics();
      
    } catch (error) {
      console.error('❌ Error creating test claim:', error);
      setError(`Failed to create test claim: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testProcessClaim = async (claimId) => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`🔧 Testing processing of claim ${claimId}...`);
      
      const result = await contractService.processInsuranceClaim(parseInt(claimId), true);
      console.log('✅ Claim processed successfully:', result);
      
      // Refresh diagnostics
      await runDiagnostics();
      
    } catch (error) {
      console.error('❌ Error processing claim:', error);
      setError(`Failed to process claim ${claimId}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        🔧 Insurance Claims Debug Panel
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={runDiagnostics} 
          disabled={loading}
          sx={{ mr: 2 }}
        >
          {loading ? <CircularProgress size={20} /> : '🔍 Run Diagnostics'}
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={createTestClaim} 
          disabled={loading}
        >
          🧪 Create Test Claim
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {debugInfo && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 System Status
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Last Check: {debugInfo.timestamp}
            </Typography>
            
            <Typography variant="body1" sx={{ mt: 1 }}>
              Contract Connected: {debugInfo.contractConnected ? '✅ Yes' : '❌ No'}
            </Typography>
            
            <Typography variant="body1">
              Total Claims: {debugInfo.claims.length}
            </Typography>
            
            <Typography variant="body1">
              Estimated Next Claim ID: {debugInfo.nextClaimId || 'Unknown'}
            </Typography>
            
            <Typography variant="body1">
              Pending Claims: {debugInfo.claims.filter(c => c.canProcess).length}
            </Typography>

            {debugInfo.errors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="error">
                  ⚠️ Errors:
                </Typography>
                {debugInfo.errors.map((err, index) => (
                  <Typography key={index} variant="body2" color="error">
                    • {err}
                  </Typography>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {debugInfo && debugInfo.claims.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Claims Details
            </Typography>
            
            <List>
              {debugInfo.claims.map((claim, index) => (
                <React.Fragment key={claim.id}>
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Typography variant="subtitle1">
                        Claim #{claim.id}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color={claim.status === 'Pending' ? 'warning.main' : 
                              claim.status === 'Approved' ? 'success.main' : 'error.main'}
                      >
                        {claim.status}
                      </Typography>
                    </Box>
                    
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2">
                            <strong>Patient:</strong> {claim.patient}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Amount:</strong> {claim.amount}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Description:</strong> {claim.description}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    {claim.canProcess && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => testProcessClaim(claim.id)}
                        disabled={loading}
                        sx={{ mt: 1, alignSelf: 'flex-start' }}
                      >
                        🔧 Test Process This Claim
                      </Button>
                    )}
                  </ListItem>
                  {index < debugInfo.claims.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {debugInfo && debugInfo.claims.length === 0 && (
        <Alert severity="info">
          No claims found. This explains why you're getting "missing revert data" errors when trying to approve/reject claims.
          <br />
          Try creating a test claim first using the button above.
        </Alert>
      )}
    </Box>
  );
};

export default InsuranceDebugPanel;
