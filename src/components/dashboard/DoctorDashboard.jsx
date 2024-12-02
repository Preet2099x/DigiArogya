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
    {
      address: "0x123...",
      recordCount: 3,
      lastVisit: "2024-03-10",
      status: "Active",
    },
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
  const [ownerAddress, setOwnerAddress] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [permissionType, setPermissionType] = useState(0); // This can be an enum or a string, depending on your smart contract
  const [incentiveAmount, setIncentiveAmount] = useState(0); // Incentive amount, if needed
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
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

  // Function for Non-Incentive Based Permission Request
  const handleNonIncentiveBasedRequest = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userPublicKey = await signer.getAddress();
      // Interact with the smart contract to fetch records
      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );

      // Call the smart contract method for non-incentive-based permission request
      const tx = await contract.requestNonIncentiveBasedPermission(
        ownerAddress, // The owner address
        ipfsCid, // The IPFS CID
        permissionType // The permission type (e.g., read, write)
      );

      // Wait for the transaction to be mined
      await tx.wait();

      // Notify user of success
      alert("Request submitted successfully!");
    } catch (error) {
      console.error("Error submitting non-incentive-based request:", error);
      alert("Error submitting request. Please try again.");
    }
  };

  // Function for Incentive Based Permission Request
  // const handleIncentiveBasedRequest = async () => {
  //   try {
  //     // Check if the contract is available

  //     // Get the signer from the provider
  //     const signer = provider.getSigner();

  //     // Call the smart contract method for incentive-based permission request
  //     const tx = await contract.requestIncentiveBasedPermission(
  //       ownerAddress,      // The owner address
  //       ipfsCid,           // The IPFS CID
  //       permissionType,    // The permission type (e.g., read, write)
  //       {
  //         value: ethers.utils.parseEther(incentiveAmount.toString()) // Sending incentive amount in Ether
  //       }
  //     );

  //     // Wait for the transaction to be mined
  //     await tx.wait();

  //     // Notify user of success
  //     alert("Request with incentive submitted successfully!");
  //   } catch (error) {
  //     console.error("Error submitting incentive-based request:", error);
  //     alert("Error submitting request. Please try again.");
  //   }
  // };

  async function getRecordsByCareProvider() {
    try {
      // Validate input
      if (typeof window.ethereum === "undefined") {
        console.error(
          "Ethereum provider is not available. Please install MetaMask or a similar wallet."
        );
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
      const records = await contract.getRecordsByCareProvider(
        careProviderAddress
      );
      console.log(records);
      setAccessibleRecords(records);
    } catch (error) {
      console.error("Error fetching records:", error);
      throw error;
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
                Make Permission Request
              </Typography>
              <Box
                component="form"
                sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}
              >
                <TextField
                  label="Owner Address"
                  variant="outlined"
                  fullWidth
                  value={ownerAddress}
                  onChange={(e) => setOwnerAddress(e.target.value)}
                />
                <TextField
                  label="IPFS CID"
                  variant="outlined"
                  fullWidth
                  value={ipfsCid}
                  onChange={(e) => setIpfsCid(e.target.value)}
                />
                <TextField
                  label="Permission Type"
                  variant="outlined"
                  fullWidth
                  value={permissionType}
                  onChange={(e) => setPermissionType(e.target.value)}
                />
                <Button
                  variant="contained"
                  sx={{ mt: 2, backgroundColor: "#00796b" }}
                  onClick={
                    permissionType === "IncentiveBased"
                      ? handleNonIncentiveBasedRequest
                      : handleNonIncentiveBasedRequest
                  }
                >
                  Submit Request
                </Button>
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
                    {accessibleRecords.map((record) => (
                      <tr
                        key={record.dataHash}
                        style={{ borderBottom: "1px solid #e0e0e0" }}
                      >
                        <td style={{ padding: "12px" }}>{record[0]}</td>
                        <td style={{ padding: "12px" }}>
                          {getDataTypeName(Number(record[3]))}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {format(
                            new Date(Number(record[5]) * 1000),
                            "MM/dd/yyyy"
                          )}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {format(
                            new Date(Number(record[6]) * 1000),
                            "MM/dd/yyyy"
                          )}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ marginRight: 1 }}
                            onClick={() => {
                              handleDownloadDialog(true);
                              setHashForDownload(record.ipfsCid);
                              setEncryptedSymmetricKey(
                                record.encryptedSymmetricKey
                              );
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
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

        {/* Success Alert */}
        <Snackbar
          open={openAlert}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseAlert}
            severity="success"
            variant="filled"
            sx={{ width: "100%" }}
          >
            File uploaded successfully!
          </Alert>
        </Snackbar>

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
