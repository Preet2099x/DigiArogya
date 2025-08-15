import { Add, CalendarMonth, ExpandMore, PersonSearch } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
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

const dataTypeMap = { 0: "EHR", 1: "PHR", 2: "Lab Results", 3: "Prescription", 4: "Imaging" };
const recordStatusMap = { 0: "Pending", 1: "Completed", 2: "Valid", 3: "Invalid" };
const statusMap = { 0: "Pending", 1: "Approved", 2: "Rejected", 3: "Completed" };

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

  useEffect(() => {
    fetchHealthRecords();
  }, []);

  useEffect(() => {
    if (tabValue === 1) fetchPermissionRequests();
    else if (tabValue === 2) fetchBookings();
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
      </Box>
    </Box>
  );
};

export default PatientDashboard;