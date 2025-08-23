import { Add, CalendarMonth, LocalHospital, Dashboard, Security, Assignment, AccountBalanceWallet, Description, Refresh as RefreshIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from "@mui/material";
import { format } from "date-fns";
import { BrowserProvider, ethers, formatEther } from "ethers";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import contractABI from "../../contractABI.json";
import FileUploader from "../files/FileUploader";
import FileDownloader from "../files/FileDownloader";
import LogoutButton from "../ui/LogoutButton";
import { approvePermission } from "../../services/transactions/approvingPermission";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const dataTypeMap = { 0: "EHR", 1: "PHR", 2: "Lab Results", 3: "Prescription", 4: "Imaging" };
const recordStatusMap = { 0: "Pending", 1: "Completed", 2: "Valid", 3: "Invalid" };
const statusMap = { 0: "Pending", 1: "Approved", 2: "Rejected", 3: "Completed" };

// Safe toast function to prevent crashes
const safeToast = {
  success: (message) => {
    try {
      toast.success(message);
    } catch (error) {
      console.log('Success:', message);
    }
  },
  error: (message) => {
    try {
      toast.error(message);
    } catch (error) {
      console.error('Error:', message);
    }
  },
  info: (message) => {
    try {
      toast.info(message);
    } catch (error) {
      console.log('Info:', message);
    }
  }
};

const PatientDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [healthRecords, setHealthRecords] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [insuranceClaims, setInsuranceClaims] = useState([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [openClaimDialog, setOpenClaimDialog] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [hashForDownload, setHashForDownload] = useState("");
  const [encryptedSymmetricKey, setEncryptedSymmetricKey] = useState("");
  const [openPrivateKeyDialog, setOpenPrivateKeyDialog] = useState(false);
  const [ownerPrivateKey, setOwnerPrivateKey] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  
  // Insurance claim form state
  const [claimForm, setClaimForm] = useState({
    claimId: '',
    insuranceProvider: '',
    insurancePlan: '',
    claimAmount: '',
    hospitalName: '',
    customHospitalName: '',
    diagnosis: '',
    medicalReportFile: null,
    recordId: ''
  });

  // Insurance providers and plans data
  const insuranceProviders = {
    'ICICI Lombard': {
      'Health Advantage': { coverage: 5.0, description: 'Basic health coverage up to 5 ETH' },
      'Complete Health Guard': { coverage: 10.0, description: 'Comprehensive health coverage up to 10 ETH' },
      'Health Booster': { coverage: 3.0, description: 'Essential health coverage up to 3 ETH' }
    },
    'Star Health': {
      'Family Health Optima': { coverage: 12.5, description: 'Family health plan up to 12.5 ETH' },
      'Senior Citizens Red Carpet': { coverage: 5.0, description: 'Senior citizen coverage up to 5 ETH' },
      'Young Star Insurance': { coverage: 8.0, description: 'Young adult plan up to 8 ETH' }
    },
    'New India Assurance': {
      'Floater Mediclaim': { coverage: 5.0, description: 'Family floater up to 5 ETH' },
      'Individual Mediclaim': { coverage: 3.0, description: 'Individual coverage up to 3 ETH' },
      'Senior Citizen Mediclaim': { coverage: 5.0, description: 'Senior coverage up to 5 ETH' }
    },
    'SBI General': {
      'Arogya Premier': { coverage: 10.0, description: 'Premium health plan up to 10 ETH' },
      'Arogya Sanjeevani': { coverage: 5.0, description: 'Standard health plan up to 5 ETH' },
      'Critical Illness': { coverage: 20.0, description: 'Critical illness coverage up to 20 ETH' }
    },
    'Oriental Insurance': {
      'Hope Health Insurance': { coverage: 5.0, description: 'Comprehensive health up to 5 ETH' },
      'Oriental Mediclaim': { coverage: 3.0, description: 'Basic mediclaim up to 3 ETH' },
      'Bhavishya Arogya': { coverage: 10.0, description: 'Future health plan up to 10 ETH' }
    },
    'United India Insurance': {
      'Family Floater Mediclaim': { coverage: 5.0, description: 'Family coverage up to 5 ETH' },
      'Individual Mediclaim': { coverage: 3.0, description: 'Individual policy up to 3 ETH' },
      'Cancer Kavach': { coverage: 25.0, description: 'Cancer insurance up to 25 ETH' }
    }
  };

  // Hospital dropdown options
  const hospitalOptions = [
    'Apollo Hospitals',
    'Fortis Healthcare',
    'AIIMS',
    'Max Healthcare',
    'Manipal Hospitals',
    'Others'
  ];

  // Helper functions
  const generateClaimId = () => {
    return 'CLM' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
  };

  const handleMedicalReportUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        safeToast.error('File size should be less than 10MB');
        return;
      }
      setClaimForm({ ...claimForm, medicalReportFile: file });
      safeToast.success('Medical report uploaded successfully');
    }
  };

  const resetClaimForm = () => {
    setClaimForm({
      claimId: '',
      insuranceProvider: '',
      insurancePlan: '',
      claimAmount: '',
      hospitalName: '',
      customHospitalName: '',
      diagnosis: '',
      medicalReportFile: null,
      recordId: ''
    });
  };

  // Generate claim ID when dialog opens
  const handleOpenClaimDialog = () => {
    const newClaimId = generateClaimId();
    setClaimForm(prev => ({ ...prev, claimId: newClaimId }));
    setOpenClaimDialog(true);
  };

  // Handle insurance plan change and auto-fill claim amount
  const handlePlanChange = (selectedPlan) => {
    const planData = insuranceProviders[claimForm.insuranceProvider][selectedPlan];
    setClaimForm({
      ...claimForm, 
      insurancePlan: selectedPlan,
      claimAmount: planData ? planData.coverage.toString() : ''
    });
  };

  // Handle provider change and reset plan/amount
  const handleProviderChange = (selectedProvider) => {
    setClaimForm({
      ...claimForm,
      insuranceProvider: selectedProvider,
      insurancePlan: '',
      claimAmount: ''
    });
  };

  const fetchInsuranceClaims = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userPublicKey = await signer.getAddress();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      
      // Get insurance claims for the patient
      const claims = await contract.getPatientClaims(userPublicKey);
      
      const fetchedClaims = claims.map((claim) => {
        const status = Number(claim.status);
        console.log('PatientDashboard - Claim status:', claim.claimId, 'Raw status:', claim.status, 'Converted status:', status);
        return {
          claimId: claim.claimId,
          claimant: claim.claimant,
          insuranceProvider: claim.insuranceProvider,
          insurancePlan: claim.insurancePlan,
          diagnosis: claim.diagnosis,
          hospitalName: claim.hospitalName,
          claimAmount: formatEther(claim.claimAmount),
          medicalReportHash: claim.medicalReportHash,
          status: status, // Ensure it's a number: 0: Pending, 1: Approved, 2: Rejected
          submissionDate: Number(claim.submissionDate),
          approvedAmount: formatEther(claim.approvedAmount),
          rejectionReason: claim.rejectionReason || ''
        };
      });
      
      setInsuranceClaims(fetchedClaims.reverse());
    } catch (error) {
      console.error("Error fetching insurance claims:", error);
      safeToast.error("Error fetching insurance claims. Please try again.");
    }
  };

  const submitInsuranceClaim = async () => {
    try {
      // Validation
      if (!claimForm.claimId || !claimForm.insuranceProvider || !claimForm.insurancePlan || 
          !claimForm.claimAmount || !claimForm.diagnosis || !claimForm.medicalReportFile) {
        safeToast.error("Please fill in all required fields and upload medical report");
        return;
      }

      if (!claimForm.hospitalName || (claimForm.hospitalName === 'Others' && !claimForm.customHospitalName)) {
        safeToast.error("Please select or enter hospital name");
        return;
      }

      // Set loading state
      setIsSubmittingClaim(true);
      safeToast.info("Processing insurance claim transaction...");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      
      const claimAmountWei = ethers.parseEther(claimForm.claimAmount);
      const finalHospitalName = claimForm.hospitalName === 'Others' ? claimForm.customHospitalName : claimForm.hospitalName;
      
      // Here you would first upload the medical report to IPFS
      // For now, we'll simulate with a placeholder hash
      const medicalReportHash = "QmExample..." + Date.now();
      
      // Submit the transaction
      const tx = await contract.submitInsuranceClaim(
        claimForm.claimId,
        claimForm.insuranceProvider,
        claimForm.insurancePlan,
        claimForm.diagnosis,
        finalHospitalName,
        claimAmountWei,
        medicalReportHash
      );
      
      safeToast.info("Transaction submitted! Waiting for confirmation...");
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        safeToast.success("Insurance claim submitted successfully! Redirecting to Insurance Dashboard...");
        
        // Close dialog and reset form
        setOpenClaimDialog(false);
        resetClaimForm();
        
        // Refresh claims list
        fetchInsuranceClaims();
        
      } else {
        throw new Error("Transaction failed");
      }
      
    } catch (error) {
      console.error("Error submitting insurance claim:", error);
      
      if (error.code === 4001) {
        safeToast.error("Transaction rejected by user");
      } else if (error.code === -32603) {
        safeToast.error("Contract execution failed. Please check your inputs.");
      } else if (error.message?.includes("insufficient funds")) {
        safeToast.error("Insufficient funds to complete the transaction");
      } else {
        safeToast.error("Failed to submit insurance claim. Please try again.");
      }
    } finally {
      // Reset loading state
      setIsSubmittingClaim(false);
    }
  };

  const fetchHealthRecords = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userPublicKey = await signer.getAddress();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      const records = await contract.getHealthRecordsByOwner(userPublicKey);

      const fetchedRecords = records.map((record) => ({
        ipfsCid: record.ipfsCid,
        dataType: dataTypeMap[record.dataType],
        provider: record.provider,
        timestamp: Number(record.timestamp),
        status: recordStatusMap[Number(record.status)],
        encryptedSymmetricKey: record.encryptedSymmetricKey,
        recordStatus: Number(record.status) // Store the raw status value for filtering
      }));
      
      // Show all records including completed ones
      setHealthRecords(fetchedRecords.reverse());
    } catch (error) {
      console.error("Error fetching health records:", error);
      safeToast.error("Error fetching health records. Please try again.");
    }
  };

  const fetchPermissionRequests = async () => {
    try {
      if (typeof window.ethereum === "undefined") {
        console.error("Ethereum provider is not available.");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userPublicKey = await signer.getAddress();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      const requests = await contract.getPendingRequestsForPatient(userPublicKey);
      
      const processedRequests = requests.map((request) => ({
        requestId: request.requestId,
        requester: request.requester,
        ipfsCid: request.ipfsCid,
        permissionType: dataTypeMap[Number(request.permissionType)],
        status: statusMap[Number(request.status)],
        requestDate: Number(request.requestDate),
        expiryDate: Number(request.expiryDate),
        incentiveAmount: request.incentiveAmount ? formatEther(request.incentiveAmount) : "0",
        isIncentiveBased: request.isIncentiveBased,
      }));
      setPermissionRequests(processedRequests);
    } catch (error) {
      console.error("Error fetching permission requests:", error);
      safeToast.error("Could not fetch permission requests.");
    }
  };

  const fetchBookings = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      const patientAddress = await signer.getAddress();
      const fetchedBookings = await contract.getAppointmentsByPatient(patientAddress);

      const processedBookings = fetchedBookings.map(booking => ({
          hospitalName: booking.hospitalName,
          appointmentType: `${booking.roomType} Room`,
          date: new Date(Number(booking.bookingDate) * 1000)
      }));
      setBookings(processedBookings.reverse());
    } catch (error) {
      console.error("Error fetching appointments:", error);
      safeToast.error("Could not fetch appointments.");
    }
  };

  useEffect(() => {
    fetchHealthRecords();
  }, []);

  useEffect(() => {
    if (tabValue === 1) fetchPermissionRequests();
    else if (tabValue === 2) fetchBookings();
    else if (tabValue === 3) fetchInsuranceClaims();
  }, [tabValue]);

  const handleRequestAction = async (requestId, action) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      if (action === "approve") await contract.approvePermission(requestId); // Corrected function name
      else if (action === "decline") await contract.declinePermissionRequest(requestId); // Assuming this exists
      fetchPermissionRequests();
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
    }
  };

  const handleBatchAccessApproval = async (requestId) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      const tx = await contract.approveBatchAccess(requestId);
      await tx.wait();
      fetchPermissionRequests();
      safeToast.success('Batch access request approved successfully!');
    } catch (error) {
      console.error('Error approving batch access request:', error);
      safeToast.error('Error approving request. Please try again.');
    }
  };

  const handleChange = (event, newValue) => setTabValue(newValue);
  const handleUploadDialog = (open) => setOpenUploadDialog(open);
  const handleDownloadDialog = (open) => setOpenDownloadDialog(open);
  const handleNewRecord = () => {
    handleUploadDialog(false);
    fetchHealthRecords();
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
        {/* Simple Header */}
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
              <Dashboard sx={{ fontSize: 32, color: '#1976d2' }} />
              <Box>
                <Typography variant="h4" fontWeight="600" color="primary">
                  Patient Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Manage your health records and insurance claims
                </Typography>
              </Box>
            </Box>
            <LogoutButton />
          </Box>
        </Box>

        {/* Simple Navigation Tabs */}
        <Box sx={{
          backgroundColor: 'white',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          mb: 3
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleChange} 
            centered 
            sx={{ 
              '& .MuiTab-root': {
                fontSize: '0.95rem',
                fontWeight: 500,
                textTransform: 'none',
                minHeight: 64,
                px: 3,
                color: '#666',
                '&:hover': {
                  color: '#1976d2'
                },
                '&.Mui-selected': {
                  color: '#1976d2',
                  fontWeight: 600
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                backgroundColor: '#1976d2'
              }
            }}
          >
            <Tab 
              icon={<Assignment sx={{ mr: 1 }} />} 
              iconPosition="start"
              label="Health Records" 
            />
            <Tab 
              icon={<Security sx={{ mr: 1 }} />} 
              iconPosition="start"
              label="Permission Requests" 
            />
            <Tab 
              icon={<CalendarMonth sx={{ mr: 1 }} />} 
              iconPosition="start"
              label="Bookings & Appointments" 
            />
            <Tab 
              icon={<AccountBalanceWallet sx={{ mr: 1 }} />} 
              iconPosition="start"
              label="Insurance Claims" 
            />
          </Tabs>
        </Box>

        {tabValue === 0 && (
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
                  <Description sx={{ fontSize: 28, color: '#1976d2' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="600" color="primary">
                      My Health Records
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Secure blockchain-based medical records
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  startIcon={<Add />} 
                  variant="contained" 
                  onClick={() => handleUploadDialog(true)}
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    }
                  }}
                >
                  Add PHR Data
                </Button>
              </Box>
            </Box>
            <Box sx={{ p: 3 }}>
              <TableContainer component={Card} sx={{ 
                boxShadow: 'none',
                border: '1px solid #e0e0e0'
              }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{
                      backgroundColor: '#f5f5f5',
                      '& .MuiTableCell-head': {
                        fontWeight: 600,
                        color: '#333'
                      }
                    }}>
                      <TableCell>Type</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>IPFS CID</TableCell>
                      <TableCell>Encrypted Key</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {healthRecords.map((record, index) => (
                      <TableRow 
                        key={index}
                        sx={{
                          '&:hover': {
                            backgroundColor: '#f9f9f9'
                          }
                        }}
                      >
                      <TableCell>{record.dataType}</TableCell><TableCell>{record.provider}</TableCell>
                      <TableCell>{record.timestamp ? format(new Date(record.timestamp * 1000), "MM/dd/yyyy") : "Invalid Date"}</TableCell>
                      <TableCell><Chip label={record.status} color={record.status === "Pending" ? "warning" : record.status === "Completed" ? "success" : record.status === "Valid" ? "primary" : "error"} size="small" /></TableCell>
                      <TableCell><a href={`https://ipfs.io/ipfs/${record.ipfsCid}`} target="_blank" rel="noopener noreferrer">{record.ipfsCid}</a></TableCell>
                      <TableCell>{record.encryptedSymmetricKey}</TableCell>
                      <TableCell><Button variant="outlined" size="small" sx={{ color: "#00796b", borderColor: "#00796b" }} onClick={() => { handleDownloadDialog(true); setHashForDownload(record.ipfsCid); setEncryptedSymmetricKey(record.encryptedSymmetricKey); }}>View</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </Box>
          </Box>
        )}

        {tabValue === 1 && (
          <TableContainer component={Card} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow><TableCell>Requester</TableCell><TableCell>Request ID</TableCell><TableCell>IPFS CID</TableCell><TableCell>Status</TableCell><TableCell>Request Date</TableCell><TableCell>Expiry Date</TableCell><TableCell>Incentive Amount</TableCell><TableCell>Incentive-Based</TableCell><TableCell>Actions</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {permissionRequests.map((request) => (
                  <TableRow key={request.requestId}>
                    <TableCell>{request.requester}</TableCell><TableCell>{request.requestId}</TableCell><TableCell>{request.ipfsCid || "N/A"}</TableCell>
                    <TableCell><Chip label={request.status} color={request.status === "Pending" ? "warning" : "success"} size="small" /></TableCell>
                    <TableCell>{request.requestDate ? format(new Date(request.requestDate * 1000), "MM/dd/yyyy") : "Invalid Date"}</TableCell>
                    <TableCell>{request.expiryDate ? format(new Date(request.expiryDate * 1000), "MM/dd/yyyy") : "Invalid Date"}</TableCell>
                    <TableCell>{request.incentiveAmount} ETH</TableCell><TableCell>{request.isIncentiveBased ? "Yes" : "No"}</TableCell>
                    <TableCell>{request.status === "Pending" && (<>{request.ipfsCid === "" ? (<Button variant="contained" size="small" sx={{ backgroundColor: "#00796b", mr: 1 }} onClick={() => handleBatchAccessApproval(request.requestId)}>Approve Batch Access</Button>) : (<Button variant="contained" size="small" sx={{ backgroundColor: "#00796b", mr: 1 }} onClick={() => { setSelectedRequestId(request.requestId); setOpenPrivateKeyDialog(true); }}>Approve</Button>)}<Button variant="outlined" size="small" color="error" onClick={() => handleRequestAction(request.requestId, "decline")}>Decline</Button></>)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary" mb={2}>My Appointments</Typography>
            <TableContainer component={Card} sx={{ boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow><TableCell>Hospital</TableCell><TableCell>Appointment Type</TableCell><TableCell>Date</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {bookings.length > 0 ? (bookings.map((booking, index) => (
                    <TableRow key={index}><TableCell>{booking.hospitalName}</TableCell><TableCell>{booking.appointmentType}</TableCell><TableCell>{format(booking.date, "PPP p")}</TableCell></TableRow>
                  ))) : (<TableRow><TableCell colSpan={3} align="center">No appointments found.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 3 && (
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
                      My Insurance Claims
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage and track your insurance claims
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={2}>
                  <Button 
                    startIcon={<RefreshIcon />}
                    variant="outlined" 
                    onClick={fetchInsuranceClaims}
                    sx={{
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      '&:hover': {
                        borderColor: '#1565c0',
                        backgroundColor: '#f3f4f6'
                      }
                    }}
                  >
                    Refresh Claims
                  </Button>
                  <Button 
                    startIcon={<LocalHospital />} 
                    variant="contained" 
                    onClick={handleOpenClaimDialog}
                    sx={{
                      backgroundColor: '#1976d2',
                      '&:hover': {
                        backgroundColor: '#1565c0'
                      }
                    }}
                  >
                    Submit New Claim
                  </Button>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ p: 3 }}>
              <TableContainer component={Card} sx={{ 
                boxShadow: 'none',
                border: '1px solid #e0e0e0'
              }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{
                      backgroundColor: '#f5f5f5',
                      '& .MuiTableCell-head': {
                        fontWeight: 600,
                        color: '#333'
                      }
                    }}>
                      <TableCell>Claim ID</TableCell>
                      <TableCell>Diagnosis</TableCell>
                      <TableCell>Hospital</TableCell>
                      <TableCell>Amount (ETH)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submission Date</TableCell>
                    <TableCell>Rejection Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {insuranceClaims.length > 0 ? (
                    insuranceClaims.map((claim, index) => (
                      <TableRow 
                        key={index}
                        sx={{
                          '&:hover': {
                            backgroundColor: '#f9f9f9'
                          }
                        }}
                      >
                        <TableCell>{claim.claimId}</TableCell>
                        <TableCell>{claim.diagnosis}</TableCell>
                        <TableCell>{claim.hospitalName}</TableCell>
                        <TableCell>{claim.claimAmount}</TableCell>
                        <TableCell>
                          <Chip 
                            label={claim.status === 0 ? "Pending" : claim.status === 1 ? "Approved" : "Rejected"} 
                            color={claim.status === 0 ? "warning" : claim.status === 1 ? "success" : "error"} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          {claim.submissionDate ? format(new Date(claim.submissionDate * 1000), "MM/dd/yyyy") : "Invalid Date"}
                        </TableCell>
                        <TableCell>{claim.rejectionReason || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No insurance claims found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            </Box>
          </Box>
        )}

        <Dialog open={openUploadDialog} onClose={() => handleUploadDialog(false)}><FileUploader onClose={() => handleUploadDialog(false)} onUpload={handleNewRecord} userRole={"Patient"} /></Dialog>
        <Dialog open={openDownloadDialog} onClose={() => handleDownloadDialog(false)}><FileDownloader onClose={() => handleDownloadDialog(false)} ipfsHash={hashForDownload} encryptedSymmetricKey={encryptedSymmetricKey} recordInfo={{ ipfsCid: hashForDownload, encryptedSymmetricKey: encryptedSymmetricKey }} /></Dialog>
        
        {/* Insurance Claim Submission Dialog */}
        <Dialog 
          open={openClaimDialog} 
          onClose={() => setOpenClaimDialog(false)} 
          maxWidth="lg" 
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
                <Typography variant="h6" fontWeight="600">Submit Insurance Claim</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Complete your insurance claim submission
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Card sx={{ 
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              p: 3
            }}>
              <Grid container spacing={3} sx={{ mt: 0.5 }}>
              
              {/* Claim ID */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Claim ID"
                  value={claimForm.claimId}
                  onChange={(e) => setClaimForm({...claimForm, claimId: e.target.value})}
                  required
                  helperText="Auto-generated unique claim identifier"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>

              {/* Insurance Provider */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Insurance Provider</InputLabel>
                  <Select
                    value={claimForm.insuranceProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    label="Insurance Provider"
                  >
                    {Object.keys(insuranceProviders).map((provider) => (
                      <MenuItem key={provider} value={provider}>
                        {provider}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Insurance Plan */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required disabled={!claimForm.insuranceProvider}>
                  <InputLabel>Insurance Plan/Type</InputLabel>
                  <Select
                    value={claimForm.insurancePlan}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    label="Insurance Plan/Type"
                  >
                    {claimForm.insuranceProvider && Object.keys(insuranceProviders[claimForm.insuranceProvider]).map((plan) => (
                      <MenuItem key={plan} value={plan}>
                        {plan} - {insuranceProviders[claimForm.insuranceProvider][plan].coverage} ETH
                      </MenuItem>
                    ))}
                  </Select>
                  {claimForm.insurancePlan && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                      {insuranceProviders[claimForm.insuranceProvider][claimForm.insurancePlan].description}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Claim Amount */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Claim Amount (ETH)"
                  type="number"
                  value={claimForm.claimAmount}
                  onChange={(e) => setClaimForm({...claimForm, claimAmount: e.target.value})}
                  required
                  inputProps={{ min: 0, step: 0.001, max: claimForm.insurancePlan ? insuranceProviders[claimForm.insuranceProvider][claimForm.insurancePlan].coverage : undefined }}
                  helperText={claimForm.insurancePlan ? 
                    `Auto-filled based on plan. Max coverage: ${insuranceProviders[claimForm.insuranceProvider][claimForm.insurancePlan].coverage} ETH` : 
                    "Select insurance plan first"}
                />
              </Grid>

              {/* Hospital Name Dropdown */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Hospital Name</InputLabel>
                  <Select
                    value={claimForm.hospitalName}
                    onChange={(e) => setClaimForm({...claimForm, hospitalName: e.target.value, customHospitalName: ''})}
                    label="Hospital Name"
                  >
                    {hospitalOptions.map((hospital) => (
                      <MenuItem key={hospital} value={hospital}>
                        {hospital}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Custom Hospital Name (Only if "Others" is selected) */}
              {claimForm.hospitalName === 'Others' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Enter Hospital Name"
                    value={claimForm.customHospitalName}
                    onChange={(e) => setClaimForm({...claimForm, customHospitalName: e.target.value})}
                    required
                    placeholder="Enter the hospital name"
                  />
                </Grid>
              )}

              {/* Diagnosis */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Diagnosis"
                  value={claimForm.diagnosis}
                  onChange={(e) => setClaimForm({...claimForm, diagnosis: e.target.value})}
                  required
                  placeholder="Enter medical diagnosis"
                />
              </Grid>

              {/* Upload Medical Report */}
              <Grid item xs={12}>
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center', backgroundColor: '#fafafa' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Upload Medical Report *
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Upload medical reports, prescriptions, or supporting documents
                    <br />
                    Supported formats: PDF, JPG, JPEG, PNG, DOC, DOCX (Max 10MB)
                  </Typography>
                  
                  <input
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    style={{ display: 'none' }}
                    id="medical-report-upload"
                    type="file"
                    onChange={handleMedicalReportUpload}
                  />
                  <label htmlFor="medical-report-upload">
                    <Button
                      variant="contained"
                      component="span"
                      sx={{ backgroundColor: '#00796b', mb: 2 }}
                    >
                      {claimForm.medicalReportFile ? 'Change File' : 'Choose File'}
                    </Button>
                  </label>
                  
                  {claimForm.medicalReportFile && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#e8f5e8', borderRadius: 1 }}>
                      <Typography variant="body2" color="success.main">
                        ✅ File uploaded: {claimForm.medicalReportFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Size: {(claimForm.medicalReportFile.size / (1024 * 1024)).toFixed(2)} MB
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

            </Grid>
            </Card>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            backgroundColor: '#f5f5f5',
            borderTop: '1px solid #e0e0e0',
            gap: 2
          }}>
            <Button 
              onClick={() => { setOpenClaimDialog(false); resetClaimForm(); }}
              variant="outlined"
              color="primary"
            >
              Cancel
            </Button>
            <Button 
              onClick={submitInsuranceClaim} 
              variant="contained" 
              color="primary"
              disabled={isSubmittingClaim || !claimForm.claimId || !claimForm.insuranceProvider || !claimForm.insurancePlan || 
                       !claimForm.claimAmount || !claimForm.diagnosis || !claimForm.medicalReportFile ||
                       (!claimForm.hospitalName || (claimForm.hospitalName === 'Others' && !claimForm.customHospitalName))}
            >
              {isSubmittingClaim ? "Submitting..." : "Submit Insurance Claim"}
            </Button>
          </DialogActions>
        </Dialog>
        
        <Dialog open={openPrivateKeyDialog} onClose={() => setOpenPrivateKeyDialog(false)}>
          <Box p={3} width={400}>
            <Typography variant="h6" mb={2}>Enter Private Key</Typography>
            <input type="password" placeholder="Private Key" value={ownerPrivateKey} onChange={(e) => setOwnerPrivateKey(e.target.value)} style={{ width: "100%", padding: "8px", marginBottom: "16px", borderRadius: "4px", border: "1px solid #ccc" }} />
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button variant="outlined" onClick={() => setOpenPrivateKeyDialog(false)}>Cancel</Button>
              <Button variant="contained" sx={{ backgroundColor: "#00796b" }} onClick={() => { approvePermission(selectedRequestId, ownerPrivateKey); setOpenPrivateKeyDialog(false); }}>Submit</Button>
            </Box>
          </Box>
        </Dialog>
      </Box>
    </Box>
  );
};

export default PatientDashboard;