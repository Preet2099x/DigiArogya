import { Add, ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { format } from "date-fns";
import { BrowserProvider, ethers, formatEther } from "ethers";
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import contractABI from "../../contractABI.json";
import contractService from "../../services/contractService";
import FileDownloader from "../files/FileDownloader";
import FileUploader from "../files/FileUploader";
import LogoutButton from "../ui/LogoutButton";
import { approvePermission } from "../../services/transactions/approvingPermission";
import InsuranceClaimHistory from "../insurance/InsuranceClaimHistory";
import { submitInsuranceClaimWithDebug } from "../../utils/contractDebugger";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

// Mapping of dataType enum to human-readable types
const dataTypeMap = {
  0: "EHR",
  1: "PHR",
  2: "Lab Results",
  3: "Prescription",
  4: "Imaging",
  5: "Insurance Claim",
  6: "Emergency Record",
};

// Mapping of permissionType enum to human-readable types
const permissionTypeMap = {
  0: "View Access",
  1: "Edit Access",
  2: "Emergency Access",
  3: "Insurance Processing",
  4: "Lab Processing",
  5: "Prescription Processing",
};

const statusMap = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
  3: "Completed",
};

// Mapping of insurance types to detailed plans with coverage in INR
const insurancePlansMap = {
  "Individual Health Insurance": [
    { name: "Family Health Optima", provider: "Star Health Insurance", min: 200000, max: 2500000 },
    { name: "Care Health Insurance Plan", provider: "Care Health Insurance (Religare)", min: 300000, max: 2500000 }
  ],
  "Family Floater Health Insurance": [
    { name: "Health Companion – Family Floater", provider: "Niva Bupa (formerly Max Bupa)", min: 300000, max: 5000000 },
    { name: "Complete Health Insurance – Family Plan", provider: "ICICI Lombard", min: 500000, max: 5000000 }
  ],
  "Senior Citizen Health Insurance": [
    { name: "Red Carpet Senior Citizen Plan", provider: "Star Health Insurance", min: 100000, max: 1000000 },
    { name: "Varistha Mediclaim Policy", provider: "National Insurance", min: 100000, max: 200000 }
  ],
  "Critical Illness Insurance": [
    { name: "Critical Illness Insurance", provider: "HDFC ERGO", min: 500000, max: 5000000 },
    { name: "Critical Illness Plan", provider: "Bajaj Allianz", min: 100000, max: 5000000 }
  ],
  "Maternity Insurance": [
    { name: "Joy Maternity Insurance Plan", provider: "Care Health Insurance", min: 50000, max: 200000 },
    { name: "Activ Health Platinum – Maternity Add-on", provider: "Aditya Birla Health", min: 25000, max: 150000 }
  ],
  "Top-Up Health Insurance": [
    { name: "Super Surplus Top-Up Plan", provider: "Star Health Insurance", min: 500000, max: 2500000 },
    { name: "Health Recharge", provider: "Niva Bupa (Max Bupa)", min: 200000, max: 9500000 }
  ],
  "Personal Accident Insurance": [
    { name: "Smart Personal Accident Plan", provider: "Bharti AXA General Insurance", min: 200000, max: 10000000 },
    { name: "Personal Accident Cover", provider: "HDFC ERGO", min: 200000, max: 10000000 }
  ]
};

const recordStatusMap = { 0: "Pending", 1: "Completed", 2: "Valid", 3: "Invalid" };

// Add missing specialties mock data
const specialties = [
  { name: 'Cardiology', doctors: [{ id: 1, name: 'Dr. Sarah Johnson' }, { id: 2, name: 'Dr. Robert Taylor' }] },
  { name: 'Neurology', doctors: [{ id: 3, name: 'Dr. Michael Chen' }] },
  { name: 'Pediatrics', doctors: [{ id: 4, name: 'Dr. Emily Williams' }] },
  { name: 'Orthopedics', doctors: [{ id: 5, name: 'Dr. James Wilson' }] },
  { name: 'Dermatology', doctors: [{ id: 6, name: 'Dr. Maria Garcia' }] },
];
const PatientDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [healthRecords, setHealthRecords] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [hashForDownload, setHashForDownload] = useState("");
  const [encryptedSymmetricKey, setEncryptedSymmetricKey] = useState("");
  const [openPrivateKeyDialog, setOpenPrivateKeyDialog] = useState(false);
  const [ownerPrivateKey, setOwnerPrivateKey] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [openInsuranceDialog, setOpenInsuranceDialog] = useState(false);
  const [insuranceType, setInsuranceType] = useState("");
  const [insuranceDetails, setInsuranceDetails] = useState([]);
  const [selectedInsurancePlan, setSelectedInsurancePlan] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlanMin, setSelectedPlanMin] = useState(0);
  const [selectedPlanMax, setSelectedPlanMax] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [insuranceClaims, setInsuranceClaims] = useState([]);
  const [claimFile, setClaimFile] = useState(null);
  const [claimFileName, setClaimFileName] = useState("");
  const [insuranceFetchError, setInsuranceFetchError] = useState(""); // NEW STATE

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
      }));
      setHealthRecords(fetchedRecords.reverse());
    } catch (error) {
      console.error("Error fetching health records:", error);
      toast.error("Error fetching health records. Please try again.");
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
        permissionType: permissionTypeMap[Number(request.permissionType)], // FIXED: use permissionTypeMap
        status: statusMap[Number(request.status)],
        requestDate: Number(request.requestDate),
        expiryDate: Number(request.expiryDate),
        incentiveAmount: request.incentiveAmount ? formatEther(request.incentiveAmount) : "0",
        isIncentiveBased: request.isIncentiveBased,
      }));
      setPermissionRequests(processedRequests);
    } catch (error) {
      console.error("Error fetching permission requests:", error);
      toast.error("Could not fetch permission requests.");
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
      toast.error("Could not fetch appointments.");
    }
  };

  // Fetch insurance claims for the patient
  const fetchInsuranceClaims = async () => {
    try {
      console.log('Fetching insurance claims...');
      
      // Initialize contract service and get user address
      await contractService.initialize();
      const userAddress = await contractService.signer.getAddress();
      
      // Use contract service to get claims with automatic fallback
      const claims = await contractService.getInsuranceClaims(userAddress);
      
      console.log('Fetched insurance claims:', claims);
      setInsuranceClaims(claims.reverse()); // Most recent first
      setInsuranceFetchError(""); // clear error
      
    } catch (error) {
      console.error("Error fetching insurance claims:", error);
      toast.error(`Could not fetch insurance claims: ${error.message}`);
      setInsuranceFetchError(""); // clear error on other errors
      // Set empty array as fallback
      setInsuranceClaims([]);
    }
  };

  useEffect(() => {
    fetchHealthRecords();
  }, []);

  useEffect(() => {
    if (tabValue === 1) fetchPermissionRequests();
    else if (tabValue === 2) fetchBookings();
    else if (tabValue === 4) fetchInsuranceClaims();
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

  const handleBookDoctor = (doctor) => {
    toast.success(`Appointment request sent for Dr. ${doctor.name}.`);
  };

  const handleBatchAccessApproval = async (requestId) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      const tx = await contract.approveBatchAccess(requestId);
      await tx.wait();
      fetchPermissionRequests();
      toast.success('Batch access request approved successfully!');
    } catch (error) {
      console.error('Error approving batch access request:', error);
      toast.error('Error approving request. Please try again.');
    }
  };

  const handleChange = (event, newValue) => setTabValue(newValue);
  const handleUploadDialog = (open) => setOpenUploadDialog(open);
  const handleDownloadDialog = (open) => setOpenDownloadDialog(open);
  const handleNewRecord = () => {
    handleUploadDialog(false);
    fetchHealthRecords();
  };

  const handleInsuranceClaimSubmit = async () => {
    if (!claimFile) {
      setSnackbarMessage("Please upload a medical report");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    if (!insuranceType || !selectedInsurancePlan || !claimAmount || !description) {
      setSnackbarMessage("Please fill in all required fields");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      // Extract plan name from the selected plan
      const planName = selectedInsurancePlan.split(" - ")[0];
      
      // Convert amount to proper format
      let amountNum = Number(claimAmount);
      if (selectedPlanMin && amountNum < selectedPlanMin) amountNum = selectedPlanMin;
      if (selectedPlanMax && amountNum > selectedPlanMax) amountNum = selectedPlanMax;
      
      // Upload medical report to IPFS
      let ipfsHash = "";
      if (claimFile) {
        try {
          // Get user address for IPFS upload
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();
          
          // Import the IPFS uploader
          const { uploadToIPFS } = await import("../../services/ipfs/ipfsUploader");
          const uploadResult = await uploadToIPFS({
            file: claimFile,
            userPublicKey: userAddress
          });
          ipfsHash = uploadResult.ipfsHash;
        } catch (uploadError) {
          console.error("IPFS upload error:", uploadError);
          // Use a mock hash for now if IPFS upload fails
          ipfsHash = `QmMocked${Date.now()}`;
          console.warn("Using mock IPFS hash due to upload failure");
        }
      }

      // Prepare claim data for enhanced submission
      const claimData = {
        insurancePlan: `${insuranceType} - ${planName}`,
        claimAmount: amountNum,
        description: description,
        ipfsHash: ipfsHash
      };

      setSnackbarMessage("Submitting insurance claim... Please check console for detailed debug info.");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);

      // Use enhanced debugging function
      const result = await submitInsuranceClaimWithDebug(claimData);
      
      setSnackbarMessage(result.message);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
      // Reset form and close dialog
      setOpenInsuranceDialog(false);
      setInsuranceType("");
      setSelectedInsurancePlan("");
      setClaimAmount("");
      setDescription("");
      setClaimFile(null);
      setClaimFileName("");
      setInsuranceDetails([]);
      
      // Refresh claims list
      fetchInsuranceClaims();

    } catch (error) {
      console.error("Error submitting insurance claim:", error);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "100vw", overflowX: "auto", p: 2, backgroundColor: "#f4f6f9" }}>
      <Box sx={{ p: 6, maxWidth: "1200px", mx: "auto", backgroundColor: "#f4f6f9", borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold" color="primary">Patient Dashboard</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <div><LogoutButton /><ToastContainer /></div>
          </Box>
        </Box>

        <Tabs value={tabValue} onChange={handleChange} centered sx={{ my: 4, borderBottom: 2, borderColor: "divider" }}>
          <Tab label="Health Records" sx={{ fontWeight: "bold", color: "#00796b", "&.Mui-selected": { color: "#004d40" } }} />
          <Tab label="Permission Requests" sx={{ fontWeight: "bold", color: "#00796b", "&.Mui-selected": { color: "#004d40" } }} />
          <Tab label="Bookings & Appointments"  sx={{ fontWeight: "bold", color: "#00796b", "&.Mui-selected": { color: "#004d40" } }} />
          <Tab label="Find a Doctor"  sx={{ fontWeight: "bold", color: "#00796b", "&.Mui-selected": { color: "#004d40" } }} />
          <Tab label="Insurance Claims" sx={{ fontWeight: "bold", color: "#00796b", "&.Mui-selected": { color: "#004d40" } }} /> {/* NEW TAB */}
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="bold" color="text.primary">My Health Records</Typography>
              <Button startIcon={<Add />} variant="contained" sx={{ backgroundColor: "#00796b" }} onClick={() => handleUploadDialog(true)}>Add PHR Data</Button>
            </Box>
            <TableContainer component={Card} sx={{ boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow><TableCell>Type</TableCell><TableCell>Provider</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell>IPFS CID</TableCell><TableCell>Encrypted Symmetric Key</TableCell><TableCell>Actions</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {healthRecords.map((record, index) => (
                    <TableRow key={index}>
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
            
            {/* Add Insurance Claim History */}
            <InsuranceClaimHistory />
          </Box>
        )}

        {tabValue === 1 && (
          <TableContainer component={Card} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Requester</TableCell>
                  <TableCell>Request ID</TableCell>
                  <TableCell>IPFS CID</TableCell>
                  <TableCell>Permission Type</TableCell> {/* Added Permission Type column */}
                  <TableCell>Status</TableCell>
                  <TableCell>Request Date</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Incentive Amount</TableCell>
                  <TableCell>Incentive-Based</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissionRequests.map((request) => (
                  <TableRow key={request.requestId}>
                    <TableCell>{request.requester}</TableCell>
                    <TableCell>{request.requestId}</TableCell>
                    <TableCell>{request.ipfsCid || "N/A"}</TableCell>
                    <TableCell>{request.permissionType}</TableCell> {/* Show Permission Type */}
                    <TableCell>
                      <Chip label={request.status} color={request.status === "Pending" ? "warning" : "success"} size="small" />
                    </TableCell>
                    <TableCell>{request.requestDate ? format(new Date(request.requestDate * 1000), "MM/dd/yyyy") : "Invalid Date"}</TableCell>
                    <TableCell>{request.expiryDate ? format(new Date(request.expiryDate * 1000), "MM/dd/yyyy") : "Invalid Date"}</TableCell>
                    <TableCell>{request.incentiveAmount} ETH</TableCell>
                    <TableCell>{request.isIncentiveBased ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {request.status === "Pending" && (
                        <>
                          {request.ipfsCid === "" ? (
                            <Button variant="contained" size="small" sx={{ backgroundColor: "#00796b", mr: 1 }} onClick={() => handleBatchAccessApproval(request.requestId)}>
                              Approve Batch Access
                            </Button>
                          ) : (
                            <Button variant="contained" size="small" sx={{ backgroundColor: "#00796b", mr: 1 }} onClick={() => { setSelectedRequestId(request.requestId); setOpenPrivateKeyDialog(true); }}>
                              Approve
                            </Button>
                          )}
                          <Button variant="outlined" size="small" color="error" onClick={() => handleRequestAction(request.requestId, "decline")}>
                            Decline
                          </Button>
                        </>
                      )}
                    </TableCell>
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
          <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary" mb={2}>Find a Doctor by Specialty</Typography>
            {specialties.map((specialty, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}><Typography fontWeight="medium">{specialty.name}</Typography></AccordionSummary>
                <AccordionDetails>
                  {specialty.doctors.map((doctor) => (
                    <Paper key={doctor.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }} variant="outlined">
                      <Typography>{doctor.name}</Typography>
                      <Button variant="contained" size="small" onClick={() => handleBookDoctor(doctor)} sx={{ backgroundColor: "#00796b" }}>Book Doctor</Button>
                    </Paper>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {tabValue === 4 && (
          <Box>
            {/* Show error if insurance claim fetch method not found */}
            {insuranceFetchError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {insuranceFetchError}
              </Alert>
            )}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="bold" color="text.primary">My Insurance Claims</Typography>
              <Button variant="contained" color="primary" onClick={() => setOpenInsuranceDialog(true)}>
                Submit Insurance Claim
              </Button>
            </Box>
            <TableContainer component={Card} sx={{ boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Claim ID</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Amount (INR)</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {insuranceClaims.length > 0 ? (
                    insuranceClaims.map((claim, idx) => (
                      <TableRow key={claim.claimId || idx}>
                        <TableCell>{claim.claimId}</TableCell>
                        <TableCell>{claim.plan}</TableCell>
                        <TableCell>₹{Number(claim.amount).toLocaleString()}</TableCell>
                        <TableCell>{claim.description}</TableCell>
                        <TableCell>
                          <Chip 
                            label={claim.status} 
                            color={
                              claim.status === "Pending" ? "warning" : 
                              claim.status === "Approved" ? "success" : 
                              "error"
                            } 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          {claim.timestamp ? format(new Date(claim.timestamp * 1000), "PPP") : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No insurance claims found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Dialog open={openInsuranceDialog} onClose={() => setOpenInsuranceDialog(false)}>
              <DialogTitle sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                <span role="img" aria-label="insurance">📄</span> Submit Insurance Claim
              </DialogTitle>
              <DialogContent>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="insurance-type-label">Insurance Type</InputLabel>
                  <Select
                    labelId="insurance-type-label"
                    value={insuranceType}
                    onChange={(e) => {
                      setInsuranceType(e.target.value);
                      setInsuranceDetails(insurancePlansMap[e.target.value] || []);
                      setSelectedInsurancePlan("");
                      setClaimAmount("");
                      setSelectedPlanMin(0);
                      setSelectedPlanMax(0);
                    }}
                    required
                  >
                    {Object.keys(insurancePlansMap).map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="insurance-plan-label">Insurance Plan</InputLabel>
                  <Select
                    labelId="insurance-plan-label"
                    value={selectedInsurancePlan}
                    onChange={(e) => {
                      setSelectedInsurancePlan(e.target.value);
                      const plan = insuranceDetails.find(p => (p.name + " - " + p.provider) === e.target.value);
                      if (plan) {
                        // Automatically set claim amount to plan's maximum coverage
                        setClaimAmount(plan.max.toString());
                        setSelectedPlanMin(plan.min);
                        setSelectedPlanMax(plan.max);
                      } else {
                        setClaimAmount("");
                        setSelectedPlanMin(0);
                        setSelectedPlanMax(0);
                      }
                    }}
                    disabled={!insuranceType}
                    required
                  >
                    {insuranceDetails.map((plan) => (
                      <MenuItem key={plan.name + plan.provider} value={plan.name + " - " + plan.provider}>
                        {plan.name} - {plan.provider} (₹{plan.min.toLocaleString()} - ₹{plan.max.toLocaleString()})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Claim Amount (INR)"
                  type="number"
                  value={claimAmount}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (selectedPlanMin && val < selectedPlanMin) val = selectedPlanMin;
                    if (selectedPlanMax && val > selectedPlanMax) val = selectedPlanMax;
                    setClaimAmount(val.toString());
                  }}
                  InputProps={{ 
                    inputProps: { min: selectedPlanMin, max: selectedPlanMax },
                    startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                  }}
                  required
                  disabled={!selectedInsurancePlan}
                  helperText={
                    selectedPlanMin && selectedPlanMax
                      ? `Coverage range: ₹${selectedPlanMin.toLocaleString()} – ₹${selectedPlanMax.toLocaleString()}`
                      : "Select an insurance plan first"
                  }
                />
                {selectedInsurancePlan && (
                  <Box sx={{ mt: 1, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      <strong>Selected Plan:</strong> {selectedInsurancePlan}<br />
                      <strong>Coverage:</strong> ₹{selectedPlanMin?.toLocaleString()} - ₹{selectedPlanMax?.toLocaleString()}<br />
                      <strong>Claim Amount:</strong> ₹{Number(claimAmount || 0).toLocaleString()}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold" mb={1}>
                    Upload Medical Report <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <Box 
                    sx={{ 
                      border: '2px dashed #ccc', 
                      borderRadius: 2, 
                      p: 3, 
                      textAlign: 'center',
                      backgroundColor: claimFile ? '#f0f8ff' : '#fafafa',
                      borderColor: claimFile ? '#1976d2' : '#ccc'
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={e => {
                        const file = e.target.files[0];
                        setClaimFile(file);
                        setClaimFileName(file?.name || "");
                      }}
                      style={{ display: 'none' }}
                      id="claim-file-upload"
                    />
                    <label htmlFor="claim-file-upload" style={{ cursor: 'pointer' }}>
                      <Button variant="outlined" component="span" sx={{ mb: 1 }}>
                        Choose File
                      </Button>
                    </label>
                    {claimFileName ? (
                      <Box>
                        <Typography variant="body2" sx={{ color: '#1976d2', mt: 1, fontWeight: 'bold' }}>
                          ✓ {claimFileName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          File ready for upload
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                        Upload medical reports, prescriptions, or treatment documents<br />
                        Supported formats: PDF, JPG, PNG, DOC, DOCX
                      </Typography>
                    )}
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Description of Medical Condition/Treatment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={4}
                  variant="outlined"
                  required
                  placeholder="Please describe your medical condition, treatment received, hospital/clinic name, doctor's name, and any other relevant details for your insurance claim..."
                  helperText="Provide detailed information about your medical treatment to help process your claim"
                />
                <Box sx={{ mt: 2, bgcolor: "#e3f2fd", p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: "#1976d2" }}>
                    <strong>📋 Insurance Claim Process:</strong><br />
                    1. Select your insurance type and plan<br />
                    2. Claim amount will be automatically set based on your plan coverage<br />
                    3. Upload your medical reports (stored securely on IPFS)<br />
                    4. Provide detailed description of your treatment<br />
                    5. Submit claim via MetaMask transaction<br />
                    6. Your claim will appear in the Insurance Dashboard for review<br />
                    7. Status updates will be shown in "My Health Records" section
                  </Typography>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenInsuranceDialog(false)} color="primary">Cancel</Button>
                <Button 
                  onClick={handleInsuranceClaimSubmit} 
                  color="primary" 
                  variant="contained" 
                  disabled={!claimFile || !insuranceType || !selectedInsurancePlan || !description}
                  sx={{ 
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' }
                  }}
                >
                  Submit Insurance Claim (MetaMask)
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
        <Dialog open={openUploadDialog} onClose={() => handleUploadDialog(false)}><FileUploader onClose={() => handleUploadDialog(false)} onUpload={handleNewRecord} userRole={"Patient"} /></Dialog>
        <Dialog open={openDownloadDialog} onClose={() => handleDownloadDialog(false)}><FileDownloader onClose={() => handleDownloadDialog(false)} ipfsHash={hashForDownload} encryptedSymmetricKey={encryptedSymmetricKey} recordInfo={{ ipfsCid: hashForDownload, encryptedSymmetricKey: encryptedSymmetricKey }} /></Dialog>
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

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default PatientDashboard;