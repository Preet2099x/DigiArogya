import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FileUploader from "../files/FileUploader";
import LogoutButton from "../ui/LogoutButton";
import { ToastContainer, toast } from "react-toastify";

//new
import { BrowserProvider, ethers, formatEther } from "ethers";
import contractABI from "../../contractABI.json";
import FileDownloader from "../files/FileDownloader";
import { format } from "date-fns";
import { getDataTypeName } from "../../utils/getDataType";
//new

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([
    // {
    //   address: "0x123...",
    //   recordCount: 3,
    //   lastVisit: "2024-03-10",
    //   status: "Active",
    // },
  ]);

  const [accessibleRecords, setAccessibleRecords] = useState([{}]);

  const [tabValue, setTabValue] = useState(0);
  const [openNewPatientDialog, setOpenNewPatientDialog] = useState(false);
  const [newPatientAddress, setNewPatientAddress] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const [patientAddress, setPatientAddress] = useState("");
  const [recordType, setRecordType] = useState("");
  const [openAlert, setOpenAlert] = useState(false);
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const navigate = useNavigate();
  const [encryptedSymmetricKey, setEncryptedSymmetricKey] = useState("");
  const [hashForDownload, setHashForDownload] = useState("");
  //new
  const [patientAddressForAccess, setPatientAddressForAccess] = useState("");
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  //

  const [toggleState, setToggleState] = useState({ toggle: false });

  const handleToggle = () => {
    setToggleState((prevState) => ({
      ...prevState,
      toggle: !prevState.toggle,
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDownloadDialog = (open) => {
    setOpenDownloadDialog(open);
  };

  const handleNewPatientClick = () => {
    setOpenNewPatientDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenNewPatientDialog(false);
    setNewPatientAddress("");
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log(`File selected: ${file.name}`);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenAlert(false);
  };

  useEffect(() => {
    // Fetch permission requests when the component mounts
    getRecordsByCareProvider();
  }, []);

  // Function to request batch access for all patient records
  const handleRequestAccess = async () => {
    try {
      if (!patientAddressForAccess) {
        setAlertMessage('Please enter the patient\'s address');
        setAlertSeverity('warning');
        setOpenAlert(true);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );

      // Request batch access for all patient records
      const tx = await contract.requestBatchAccess(patientAddressForAccess);
      await tx.wait();

      setAlertMessage('Access request sent successfully');
      setAlertSeverity('success');
      setOpenAlert(true);
      setPatientAddressForAccess('');
    } catch (error) {
      console.error('Error requesting access:', error);
      setAlertMessage('Failed to send access request: ' + error.message);
      setAlertSeverity('error');
      setOpenAlert(true);
    }
  };

  async function getRecordsByCareProvider() {
    try {
      // Validate input
      if (typeof window.ethereum === "undefined") {
        console.error(
          "Ethereum provider is not available. Please install MetaMask or a similar wallet."
        );
        setAlertMessage("Ethereum provider is not available. Please install MetaMask or a similar wallet.");
        setAlertSeverity("error");
        setOpenAlert(true);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const careProviderAddress = await signer.getAddress();

      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );
      
      // Set loading state if needed
      // setIsLoading(true);
      
      const records = await contract.getRecordsByCareProvider(
        careProviderAddress
      );
      
      console.log("Records fetched:", records);
      
      // Validate records before setting state
      if (!records) {
        console.warn("No records returned from contract");
        setAccessibleRecords([]);
        return;
      }
      
      // Process records to ensure they're in the expected format
      const processedRecords = Array.isArray(records) ? records : [];
      setAccessibleRecords(processedRecords);
      
      if (processedRecords.length === 0) {
        setAlertMessage("No records found for your account");
        setAlertSeverity("info");
        setOpenAlert(true);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      setAlertMessage(`Failed to fetch records: ${error.message || "Unknown error"}`);
      setAlertSeverity("error");
      setOpenAlert(true);
      setAccessibleRecords([]);
    } finally {
      // Reset loading state if needed
      // setIsLoading(false);
    }
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100vw",
        overflowX: "auto",
        p: 2,
        backgroundColor: "#f4f6f9",
      }}
    >
      <Box
        sx={{
          p: 6,
          maxWidth: "1200px",
          mx: "auto",
          gap: 6,
          background: "#f4f6f9",
          borderRadius: 2,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Typography variant="h4" fontWeight="bold" color="primary">
            Doctor Dashboard
          </Typography>
          <div>
            <LogoutButton />
          </div>
        </Box>

        <Box mt={4}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{ borderBottom: 2, borderColor: "divider" }}
          >
            <Tab
              label="My Patients"
              sx={{
                fontWeight: "bold",
                color: "#00796b",
                "&.Mui-selected": { color: "#004d40" },
              }}
            />
            <Tab
              label="Accessible Records"
              sx={{
                fontWeight: "bold",
                color: "#00796b",
                "&.Mui-selected": { color: "#004d40" },
              }}
            />
            <Tab
              label="Upload Records"
              sx={{
                fontWeight: "bold",
                color: "#00796b",
                "&.Mui-selected": { color: "#004d40" },
              }}
            />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Box mt={4}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" color="textSecondary">
                Patient List
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<Plus />}
                  sx={{ backgroundColor: "#00796b" }}
                  onClick={handleNewPatientClick}
                >
                  New Patient
                </Button>
              </Box>
            </Box>

            <Card sx={{ marginTop: 2 }}>
              <CardContent>
                <Box overflow="auto">
                  <table style={{ width: "100%" }}>
                    <thead style={{ backgroundColor: "#f0f0f0" }}>
                      <tr>
                        <th style={{ padding: "12px", textAlign: "left" }}>
                          Patient Address
                        </th>
                        <th style={{ padding: "12px", textAlign: "left" }}>
                          Records
                        </th>
                        <th style={{ padding: "12px", textAlign: "left" }}>
                          Last Visit
                        </th>
                        <th style={{ padding: "12px", textAlign: "left" }}>
                          Status
                        </th>
                        <th style={{ padding: "12px", textAlign: "left" }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient) => (
                        <tr
                          key={patient.address}
                          style={{ borderBottom: "1px solid #e0e0e0" }}
                        >
                          <td style={{ padding: "12px" }}>{patient.address}</td>
                          <td style={{ padding: "12px" }}>
                            {patient.recordCount}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {patient.lastVisit}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <Typography
                              variant="body2"
                              color={
                                patient.status === "Active"
                                  ? "success.main"
                                  : "warning.main"
                              }
                            >
                              {patient.status}
                            </Typography>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{ marginRight: 1 }}
                            >
                              View Records
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
            {/* Request Form */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" fontWeight="bold">
                Request Patient Records Access
              </Typography>
              <Box
                component="form"
                sx={{ mt: 2, display: "flex", gap: 2, alignItems: "flex-start" }}
              >
                <TextField
                  label="Patient Address"
                  variant="outlined"
                  fullWidth
                  value={patientAddressForAccess}
                  onChange={(e) => setPatientAddressForAccess(e.target.value)}
                  placeholder="Enter patient's Ethereum address"
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="contained"
                  sx={{ backgroundColor: "#00796b", height: "56px" }}
                  onClick={handleRequestAccess}
                >
                  Request Access
                </Button>
              </Box>
              <Dialog
                open={openDownloadDialog}
                onClose={() => handleDownloadDialog(false)}
              >
                <FileDownloader
                  onClose={() => handleDownloadDialog(false)}
                  ipfsHash={hashForDownload}
                  encryptedSymmetricKey={encryptedSymmetricKey}
                />
              </Dialog>
              <Snackbar
                open={openAlert}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
              >
                <Alert
                  onClose={handleCloseAlert}
                  severity={alertSeverity}
                  sx={{ width: "100%" }}
                >
                  {alertMessage}
                </Alert>
              </Snackbar>
            </Box>
          </Box>
        )}

        {tabValue === 1 && (
          <Card sx={{ marginTop: 4 }}>
            <CardContent>
              <Box overflow="auto">
                <table style={{ width: "100%" }}>
                  <thead style={{ backgroundColor: "#f0f0f0" }}>
                    <tr>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Patient
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Record Type
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Date Created
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Access Until
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessibleRecords && accessibleRecords.length > 0 ? (
                      accessibleRecords.map((record, index) => {
                        try {
                          // Ensure record exists and has necessary properties
                          if (!record) return null;
                          
                          // Debug log to see record structure
                          console.log(`Record ${index}:`, record);
                          
                          return (
                            <tr
                              key={`record-${index}`}
                              style={{ borderBottom: "1px solid #e0e0e0" }}
                            >
                              <td style={{ padding: "12px" }}>
                                {record.owner || "Unknown"}
                              </td>
                              <td style={{ padding: "12px" }}>
                                {record.dataType !== undefined ? getDataTypeName(Number(record.dataType)) : "Unknown"}
                              </td>
                              <td style={{ padding: "12px" }}>
                                {record.approvedDate !== undefined ? 
                                  format(new Date(Number(record.approvedDate) * 1000), "MM/dd/yyyy") : 
                                  "Unknown"
                                }
                              </td>
                              <td style={{ padding: "12px" }}>
                                {record.expiryDate !== undefined ? 
                                  format(new Date(Number(record.expiryDate) * 1000), "MM/dd/yyyy") : 
                                  "Unknown"
                                }
                              </td>
                              <td style={{ padding: "12px" }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  sx={{ marginRight: 1 }}
                                  onClick={() => {
                                    handleDownloadDialog(true);
                                    setHashForDownload(record.ipfsCid);
                                    setEncryptedSymmetricKey(record.encryptedSymmetricKey);
                                  }}
                                  disabled={!record.ipfsCid || !record.encryptedSymmetricKey}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        } catch (error) {
                          console.error("Error rendering record:", error, record);
                          return null;
                        }
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: "12px", textAlign: "center" }}>
                          No records available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        )}

        {tabValue === 2 && <FileUploader userRole={"Provider"} />}

        <Dialog open={openNewPatientDialog} onClose={handleCloseDialog}>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Patient Ethereum Address"
              type="text"
              fullWidth
              variant="outlined"
              value={newPatientAddress}
              onChange={(e) => setNewPatientAddress(e.target.value)}
              placeholder="0x..."
            />
          </DialogContent>
          {/* <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleSendRequest} variant="contained">
          Send Request
        </Button>
      </DialogActions> */}
        </Dialog>



        <Dialog
          open={openDownloadDialog}
          onClose={() => handleDownloadDialog(false)}
        >
          <FileDownloader
            onClose={() => handleDownloadDialog(false)}
            ipfsHash={hashForDownload}
            encryptedSymmetricKey={encryptedSymmetricKey}
          />
        </Dialog>
      </Box>
    </Box>
  );
};

export default DoctorDashboard;
