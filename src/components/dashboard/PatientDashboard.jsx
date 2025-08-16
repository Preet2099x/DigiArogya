import { Add, CalendarMonth, ExpandMore, PersonSearch } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
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
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import contractABI from "../../contractABI.json";
import FileDownloader from "../files/FileDownloader";
import FileUploader from "../files/FileUploader";
import LogoutButton from "../ui/LogoutButton";
import { approvePermission } from "../../services/transactions/approvingPermission";

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

  const navigate = useNavigate();

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
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      let claims = [];
      if (typeof contract.getInsuranceClaims === "function") {
        const userPublicKey = await signer.getAddress();
        claims = await contract.getInsuranceClaims(userPublicKey);
        setInsuranceFetchError(""); // clear error
      } else if (typeof contract.getInsuranceClaimsByPatient === "function") {
        const userPublicKey = await signer.getAddress();
        claims = await contract.getInsuranceClaimsByPatient(userPublicKey);
        setInsuranceFetchError(""); // clear error
      } else {
        // No insurance claim method in contract
        toast.error("Insurance claim fetch method not found in contract. Please update contract.");
        setInsuranceClaims([]);
        setInsuranceFetchError("Insurance claim fetch method not found in contract. Please update contract."); // SET ERROR
        return;
      }
      // Map claims to readable format
      const processedClaims = claims.map((claim) => ({
        claimId: claim.claimId,
        plan: claim.plan,
        amount: claim.amount,
        description: claim.description,
        status: claim.status,
        timestamp: Number(claim.timestamp),
      }));
      setInsuranceClaims(processedClaims.reverse());
    } catch (error) {
      console.error("Error fetching insurance claims:", error);
      toast.error("Could not fetch insurance claims.");
      setInsuranceFetchError(""); // clear error on other errors
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
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      const userPublicKey = await signer.getAddress();
      let planName = selectedInsurancePlan.split(" - ")[0];
      let amountNum = Number(claimAmount);
      if (selectedPlanMin && amountNum < selectedPlanMin) amountNum = selectedPlanMin;
      if (selectedPlanMax && amountNum > selectedPlanMax) amountNum = selectedPlanMax;
      let ipfsHash = "";
      if (claimFile) {
        // Replace this with your actual IPFS upload logic
        ipfsHash = "QmMockedIpfsHashForInsurancePaper";
      }
      // FIX: Use the correct method name from your contract ABI
      if (typeof contract.addInsuranceClaim === "function") {
        const tx = await contract.addInsuranceClaim(
          userPublicKey,
          planName,
          amountNum.toString(),
          description,
          ipfsHash
        );
        await tx.wait();
        toast.success("Insurance claim submitted successfully!");
        setOpenInsuranceDialog(false);
        fetchInsuranceClaims();
        setClaimFile(null);
        setClaimFileName("");
      } else {
        toast.error("Smart contract does not have addInsuranceClaim function. Please check ABI and contract deployment.");
      }
    } catch (error) {
      console.error("Error submitting insurance claim:", error);
      toast.error("Error submitting insurance claim. Please try again.");
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
                        <TableCell>{claim.amount}</TableCell>
                        <TableCell>{claim.description}</TableCell>
                        <TableCell>
                          <Chip label={claim.status} color={claim.status === "Pending" ? "warning" : claim.status === "Approved" ? "success" : "error"} size="small" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No insurance claims found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Dialog open={openInsuranceDialog} onClose={() => setOpenInsuranceDialog(false)}>
              <DialogTitle>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#1976d2' }}>
                  <span role="img" aria-label="insurance">📄</span> Submit Insurance Claim
                </Typography>
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
                        setClaimAmount(plan.min.toString());
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
                        {plan.name} - {plan.provider}
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
                    let val = e.target.value;
                    if (selectedPlanMin && Number(val) < selectedPlanMin) val = selectedPlanMin.toString();
                    if (selectedPlanMax && Number(val) > selectedPlanMax) val = selectedPlanMax.toString();
                    setClaimAmount(val);
                  }}
                  InputProps={{ inputProps: { min: selectedPlanMin, max: selectedPlanMax } }}
                  required
                  helperText={
                    selectedPlanMin && selectedPlanMax
                      ? `Allowed range: ₹${selectedPlanMin.toLocaleString()} – ₹${selectedPlanMax.toLocaleString()}`
                      : ""
                  }
                />
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold" mb={1}>
                    Upload Medical Report <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => {
                      setClaimFile(e.target.files[0]);
                      setClaimFileName(e.target.files[0]?.name || "");
                    }}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  {claimFileName && (
                    <Typography variant="caption" sx={{ color: '#666', mt: 1 }}>
                      Selected: {claimFileName}
                    </Typography>
                  )}
                </Box>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={4}
                  variant="outlined"
                  required
                />
                <Box sx={{ mt: 2, bgcolor: "#e3f2fd", p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: "#1976d2" }}>
                    <strong>How it works:</strong><br />
                    1. Fill in your claim details including a unique Claim ID<br />
                    2. Upload your medical report (will be stored securely on IPFS)<br />
                    3. Submit the claim to blockchain using your MetaMask wallet<br />
                    4. Your claim will be recorded as a PHR (Personal Health Record)<br />
                    5. Insurance provider can request access to review your claim
                  </Typography>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenInsuranceDialog(false)} color="primary">Cancel</Button>
                <Button onClick={handleInsuranceClaimSubmit} color="primary" variant="contained" disabled={!claimFile}>
                  Submit Insurance Claim
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