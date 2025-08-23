import ShieldIcon from '@mui/icons-material/Shield';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { BrowserProvider, ethers } from 'ethers';
import React, { useState } from 'react';
// 1. Make sure you have your contract ABI here
import contractABI from '../../contractABI.json';

// 2. PASTE YOUR DEPLOYED CONTRACT ADDRESS HERE
const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";

// --- Data for UI Dropdowns ---
const insuranceData = {
  'Bajaj Allianz': ['Health Guard', 'Silver Health', 'Family Floater'],
  'HDFC ERGO': ['Optima Restore', 'my:health Suraksha', 'Energy Health'],
  'Star Health': ['Family Health Optima', 'Senior Citizens Red Carpet', 'Comprehensive'],
};

const initialRecords = [
    { id: '1', patientAddress: '0x123...abc', provider: 'Star Health', plan: 'Family Health Optima', amount: '500000', status: 'Active', date: '15/07/2025' },
    { id: '2', patientAddress: '0x456...def', provider: 'HDFC ERGO', plan: 'Optima Restore', amount: '1000000', status: 'Active', date: '01/08/2025' }
];

const InsuranceDashboard = () => {
  // The table starts with some example records
  const [records, setRecords] = useState(initialRecords);

  // State for the form inputs
  const [patientAddress, setPatientAddress] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [amount, setAmount] = useState('');
  
  // State for the transaction
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProviderChange = (event) => {
    setSelectedProvider(event.target.value);
    setSelectedPlan('');
  };

  // This function sends the transaction and updates the local table
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!patientAddress || !selectedProvider || !selectedPlan || !amount) {
      setError('All fields are required.');
      return;
    }
    
    // This validation prevents the ENS error by ensuring a proper 0x... address is used
    if (!ethers.isAddress(patientAddress)) {
      setError('Invalid Ethereum address format. Please use a 0x... address.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Connect to MetaMask and get the signer
      if (!window.ethereum) throw new Error("MetaMask is not installed.");
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      // 2. Create an instance of your contract
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

      // 3. Call the smart contract function
      const tx = await contract.addEHRData(
        patientAddress,
        `policy-tx-${Date.now()}`,
        5, // INSURANCE_CLAIM enum
        "placeholder-key"
      );
      
      // 4. Wait for the transaction to complete
      await tx.wait();

      // 5. On success, add a new row to the table on the screen
      const newRecord = {
        id: Date.now().toString(),
        patientAddress,
        provider: selectedProvider,
        plan: selectedPlan,
        amount,
        status: 'Active',
        date: new Date().toLocaleDateString('en-IN'),
      };
      setRecords([newRecord, ...records]);

      // Clear the form
      setPatientAddress('');
      setSelectedProvider('');
      setSelectedPlan('');
      setAmount('');

    } catch (err) {
      console.error("Transaction failed:", err);
      setError(err.reason || err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 4, backgroundColor: '#f4f6f9' }}>
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <ShieldIcon color="primary" sx={{ fontSize: '2.5rem' }} />
          <Typography variant="h4" fontWeight="bold">
            Insurance Dashboard
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 4, borderRadius: 4, mb: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={3}>Register New Policy</Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><TextField fullWidth label="Patient Wallet Address" value={patientAddress} onChange={(e) => setPatientAddress(e.target.value)}/></Grid>
              <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel>Insurance Provider</InputLabel><Select value={selectedProvider} label="Insurance Provider" onChange={handleProviderChange}>{Object.keys(insuranceData).map((p) => (<MenuItem key={p} value={p}>{p}</MenuItem>))}</Select></FormControl></Grid>
              <Grid item xs={12} md={6}><FormControl fullWidth disabled={!selectedProvider}><InputLabel>Insurance Plan</InputLabel><Select value={selectedPlan} label="Insurance Plan" onChange={(e) => setSelectedPlan(e.target.value)}>{selectedProvider && insuranceData[selectedProvider].map((plan) => (<MenuItem key={plan} value={plan}>{plan}</MenuItem>))}</Select></FormControl></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Coverage Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} InputProps={{startAdornment: <InputAdornment position="start">₹</InputAdornment>}}/></Grid>
              <Grid item xs={12}>{error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}<Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Register on Blockchain'}</Button></Grid>
            </Grid>
          </form>
        </Paper>

        <Typography variant="h6" fontWeight={600} mb={3}>Registered Policies</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
          <Table>
            <TableHead><TableRow><TableCell sx={{fontWeight:'bold'}}>Patient Address</TableCell><TableCell sx={{fontWeight:'bold'}}>Provider</TableCell><TableCell sx={{fontWeight:'bold'}}>Plan</TableCell><TableCell sx={{fontWeight:'bold'}}>Amount</TableCell><TableCell sx={{fontWeight:'bold'}}>Status</TableCell><TableCell sx={{fontWeight:'bold'}}>Date</TableCell></TableRow></TableHead>
            <TableBody>
              {records.map((row) => (<TableRow key={row.id}><TableCell>{row.patientAddress}</TableCell><TableCell>{row.provider}</TableCell><TableCell>{row.plan}</TableCell><TableCell>₹{Number(row.amount).toLocaleString('en-IN')}</TableCell><TableCell><Chip label={row.status} color="success" size="small" /></TableCell><TableCell>{row.date}</TableCell></TableRow>))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default InsuranceDashboard;