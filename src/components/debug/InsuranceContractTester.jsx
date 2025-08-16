import React, { useState } from 'react';
import { BrowserProvider, ethers } from 'ethers';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent
} from '@mui/material';

// Import both contract ABIs and the contract service
import mainContractABI from '../../contractABI.json';
import insuranceContractABI from '../../insuranceContractABI.json';
import contractService from '../../services/contractService';

const MAIN_CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const INSURANCE_CONTRACT_ADDRESS = '0xd9c46D8bFB4E1B0E6eF4b76aED75d7eF7d5A1e6f';

const InsuranceContractTester = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');
  const [tabValue, setTabValue] = useState(0);
  const [claims, setClaims] = useState([]);
  const [userAddress, setUserAddress] = useState('');

  const [claimForm, setClaimForm] = useState({
    plan: '',
    amount: '',
    description: '',
    ipfsHash: ''
  });

  const showMessage = (msg, sev = 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setTimeout(() => setMessage(''), 5000);
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }
      
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setUserAddress(address);
      showMessage(`Connected to wallet: ${address}`, 'success');
      return { provider, signer };
    } catch (error) {
      showMessage(`Connection failed: ${error.message}`, 'error');
      return null;
    }
  };

  const testMainContract = async () => {
    setLoading(true);
    try {
      const wallet = await connectWallet();
      if (!wallet) return;

      const contract = new ethers.Contract(MAIN_CONTRACT_ADDRESS, mainContractABI.abi, wallet.signer);
      
      // Test if functions exist
      const functions = ['getInsuranceClaims', 'getAllInsuranceClaims', 'addInsuranceClaim'];
      const existingFunctions = [];
      
      functions.forEach(funcName => {
        if (typeof contract[funcName] === 'function') {
          existingFunctions.push(funcName);
        }
      });
      
      showMessage(`Main Contract Functions: ${existingFunctions.join(', ')}`, 'info');
      
      // Try to get claims
      try {
        const userClaims = await contract.getInsuranceClaims(userAddress);
        setClaims(userClaims.map((claim, index) => ({
          source: 'Main Contract',
          claimId: Number(claim.claimId) || index,
          plan: claim.plan || 'N/A',
          amount: Number(claim.amount) || 0,
          description: claim.description || 'N/A',
          status: claim.status || 'N/A'
        })));
        showMessage(`Found ${userClaims.length} claims in main contract`, 'success');
      } catch (error) {
        showMessage(`Error fetching from main contract: ${error.message}`, 'warning');
      }
      
    } catch (error) {
      showMessage(`Main contract test failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testInsuranceContract = async () => {
    setLoading(true);
    try {
      const wallet = await connectWallet();
      if (!wallet) return;

      const contract = new ethers.Contract(INSURANCE_CONTRACT_ADDRESS, insuranceContractABI.abi, wallet.signer);
      
      // Get user claims
      try {
        const userClaims = await contract.getInsuranceClaims(userAddress);
        setClaims(userClaims.map((claim, index) => ({
          source: 'Insurance Contract',
          claimId: Number(claim.claimId) || index,
          plan: claim.plan || 'N/A',
          amount: Number(claim.amount) || 0,
          description: claim.description || 'N/A',
          status: claim.status || 'N/A'
        })));
        showMessage(`Found ${userClaims.length} claims in insurance contract`, 'success');
      } catch (error) {
        showMessage(`Error fetching from insurance contract: ${error.message}`, 'warning');
      }
      
    } catch (error) {
      showMessage(`Insurance contract test failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const addSampleData = async () => {
    setLoading(true);
    try {
      const wallet = await connectWallet();
      if (!wallet) return;

      showMessage('Adding sample data via contract service...', 'info');
      
      const result = await contractService.addSampleData();
      showMessage('Sample data added successfully!', 'success');
      
    } catch (error) {
      showMessage(`Failed to add sample data: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testInsuranceContractService = async () => {
    setLoading(true);
    try {
      const wallet = await connectWallet();
      if (!wallet) return;

      // Test getting claims using contract service
      const userClaims = await contractService.getInsuranceClaims(userAddress);
      const allClaims = await contractService.getAllInsuranceClaims();
      
      setClaims([
        ...userClaims.map(claim => ({ ...claim, source: 'Contract Service (User Claims)' })),
        ...allClaims.map(claim => ({ ...claim, source: 'Contract Service (All Claims)' }))
      ]);
      
      showMessage(`Contract Service Test: Found ${userClaims.length} user claims, ${allClaims.length} total claims`, 'success');
      
    } catch (error) {
      showMessage(`Contract service test failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitClaim = async () => {
    setLoading(true);
    try {
      const wallet = await connectWallet();
      if (!wallet) return;

      if (!claimForm.plan || !claimForm.amount || !claimForm.description) {
        showMessage('Please fill in all required fields', 'error');
        return;
      }

      showMessage('Submitting claim via contract service...', 'info');
      
      const result = await contractService.addInsuranceClaim(
        userAddress, // patient
        claimForm.plan,
        claimForm.amount, // amount (will be converted to wei in service)
        claimForm.description,
        claimForm.ipfsHash || ''
      );
      
      showMessage('Claim submitted successfully!', 'success');
      setClaimForm({ plan: '', amount: '', description: '', ipfsHash: '' });
      
    } catch (error) {
      showMessage(`Failed to submit claim: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Insurance Contract Tester
      </Typography>
      
      {message && (
        <Alert severity={severity} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Wallet Status
        </Typography>
        <Typography>
          {userAddress ? `Connected: ${userAddress}` : 'Not connected'}
        </Typography>
        <Button variant="outlined" onClick={connectWallet} sx={{ mt: 1 }}>
          Connect Wallet
        </Button>
      </Paper>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="Test Contracts" />
        <Tab label="Submit Claim" />
        <Tab label="View Claims" />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Contract Testing
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button 
                variant="contained" 
                onClick={testMainContract}
                disabled={loading}
              >
                Test Main Contract
              </Button>
              <Button 
                variant="contained" 
                onClick={testInsuranceContract}
                disabled={loading}
              >
                Test Insurance Contract
              </Button>
              <Button 
                variant="contained" 
                onClick={testInsuranceContractService}
                disabled={loading}
                color="success"
              >
                Test Contract Service
              </Button>
              <Button 
                variant="outlined" 
                onClick={addSampleData}
                disabled={loading}
              >
                Add Sample Data
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Main Contract: {MAIN_CONTRACT_ADDRESS}<br/>
              Insurance Contract: {INSURANCE_CONTRACT_ADDRESS}
            </Typography>
          </Paper>
        </Box>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Submit New Claim
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Insurance Plan"
              value={claimForm.plan}
              onChange={(e) => setClaimForm({...claimForm, plan: e.target.value})}
              required
            />
            <TextField
              label="Amount (ETH)"
              type="number"
              value={claimForm.amount}
              onChange={(e) => setClaimForm({...claimForm, amount: e.target.value})}
              required
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={claimForm.description}
              onChange={(e) => setClaimForm({...claimForm, description: e.target.value})}
              required
            />
            <TextField
              label="IPFS Hash (optional)"
              value={claimForm.ipfsHash}
              onChange={(e) => setClaimForm({...claimForm, ipfsHash: e.target.value})}
            />
            <Button 
              variant="contained" 
              onClick={submitClaim}
              disabled={loading || !userAddress}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Claim'}
            </Button>
          </Box>
        </Paper>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Claims Found: {claims.length}
          </Typography>
          {claims.map((claim, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">
                  Claim #{claim.claimId} - {claim.status}
                </Typography>
                <Typography color="text.secondary">
                  Source: {claim.source}
                </Typography>
                <Typography>
                  Plan: {claim.plan}
                </Typography>
                <Typography>
                  Amount: {claim.amount} ETH
                </Typography>
                <Typography>
                  Description: {claim.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
          {claims.length === 0 && (
            <Typography color="text.secondary">
              No claims found. Try testing contracts first or adding sample data.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default InsuranceContractTester;
