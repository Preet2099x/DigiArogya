import { Add } from "@mui/icons-material";
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
} from "@mui/material";
import { format } from "date-fns"; // Import date formatting utility
import { BrowserProvider, ethers, formatEther, BigNumber } from "ethers";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import contractABI from "../../contractABI.json";
import FileDownloader from "../files/FileDownloader";
import FileUploader from "../files/FileUploader";
import LogoutButton from "../ui/LogoutButton";
import { approvePermission } from "../../services/transactions/approvingPermission"; // Import the function

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

// Mapping of dataType enum to human-readable types
const dataTypeMap = {
  0: "EHR", // Corresponds to EHR
  1: "PHR", // Corresponds to PHR
  2: "Lab Results", // Corresponds to LAB_RESULT
  3: "Prescription", // Corresponds to PRESCRIPTION
  4: "Imaging", // Corresponds to IMAGING
};
const statusMap = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
  3: "Completed", // Add more status codes as needed
};

const PatientDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [healthRecords, setHealthRecords] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [hashForDownload, setHashForDownload] = useState("");
  const [encryptedSymmetricKey, setEncryptedSymmetricKey] = useState("");
  const [openPrivateKeyDialog, setOpenPrivateKeyDialog] = useState(false);
  const [ownerPrivateKey, setOwnerPrivateKey] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const navigate = useNavigate();

  // Define fetchHealthRecords function
  const fetchHealthRecords = async () => {
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

      // Fetch records using the user's address
      const records = await contract.getHealthRecordsByOwner(userPublicKey);

      // Update state with the fetched records directly from the blockchain
      const fetchedRecords = records.map((record) => ({
        ipfsCid: record.ipfsCid,
        dataType: dataTypeMap[record.dataType], // Map dataType enum to readable type
        provider: record.provider,
        timestamp: Number(record.timestamp), // Convert BigInt to Number
        isValid: record.isValid,
        encryptedSymmetricKey: record.encryptedSymmetricKey,
      }));

      // Reverse the records array to show the latest first
      setHealthRecords(fetchedRecords.reverse());
    } catch (error) {
      console.error("Error fetching health records:", error);
      alert("Error fetching health records. Please try again.");
    }
  };

  useEffect(() => {
    // Fetch health records from the blockchain when the component mounts
    fetchHealthRecords();
  }, []); // Run once when the component mounts

  //fetching all pending request of the patient

  const fetchPermissionRequests = async () => {
    try {
      if (typeof window.ethereum === "undefined") {
        console.error(
          "Ethereum provider is not available. Please install MetaMask or a similar wallet."
        );
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userPublicKey = await signer.getAddress();

      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );
      const requests = await contract.getPendingRequestsForPatient(
        userPublicKey
      );
      console.log(requests);
      // Process fetched requests
      const processedRequests = requests.map((request) => {
        return {
          requestId: request.requestId,
          requester: request.requester,
          ipfsCid: request.ipfsCid,
          permissionType: dataTypeMap[Number(request.permissionType)], // Assuming PermissionType is an enum
          status: statusMap[Number(request.status)], // Assuming a statusMap exists
          requestDate: Number(request.requestDate),
          expiryDate: Number(request.expiryDate),
          incentiveAmount: request.incentiveAmount
            ? formatEther(request.incentiveAmount)
            : "0",
          isIncentiveBased: request.isIncentiveBased,
        };
      });

      setPermissionRequests(processedRequests);
    } catch (error) {
      console.error("Error fetching permission requests:", error);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );

      if (action === "approve") {
        await contract.approvePermissionRequest(requestId);
      } else if (action === "decline") {
        await contract.declinePermissionRequest(requestId);
      }

      // Refresh the requests after the action
      fetchPermissionRequests();
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
    }
  };

  useEffect(() => {
    // Fetch permission requests when the component mounts
    fetchPermissionRequests();
  }, []);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleUploadDialog = (open) => {
    setOpenUploadDialog(open);
  };

  const handleDownloadDialog = (open) => {
    setOpenDownloadDialog(open);
  };

  const handleNewRecord = (newRecord) => {
    // After uploading, refetch the health records
    setHealthRecords((prev) => [newRecord, ...prev]); // Add new record at the top
    handleUploadDialog(false); // Close the upload dialog

    // Re-fetch the updated records from the blockchain
    fetchHealthRecords();
  };

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
          backgroundColor: "#f4f6f9",
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
            Patient Dashboard
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <div>
              <LogoutButton />
              <ToastContainer />
            </div>
          </Box>
        </Box>

        <Tabs
          value={tabValue}
          onChange={handleChange}
          centered
          sx={{ my: 4, borderBottom: 2, borderColor: "divider" }}
        >
          <Tab
            label="Health Records"
            sx={{
              fontWeight: "bold",
              color: "#00796b",
              "&.Mui-selected": { color: "#004d40" },
            }}
          />
          <Tab
            label="Permission Requests"
            sx={{
              fontWeight: "bold",
              color: "#00796b",
              "&.Mui-selected": { color: "#004d40" },
            }}
          />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                My Health Records
              </Typography>
              <Button
                startIcon={<Add />}
                variant="contained"
                sx={{ backgroundColor: "#00796b" }}
                onClick={() => handleUploadDialog(true)}
              >
                Add PHR Data
              </Button>
            </Box>
            <TableContainer component={Card} sx={{ boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>IPFS CID</TableCell>
                    <TableCell>Encrypted Symmetric Key</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {healthRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.dataType}</TableCell>
                      <TableCell>{record.provider}</TableCell>
                      <TableCell>
                        {record.timestamp
                          ? format(
                              new Date(record.timestamp * 1000),
                              "MM/dd/yyyy"
                            )
                          : "Invalid Date"}
                      </TableCell>
                      {/* Format date properly */}
                      <TableCell>
                        <Chip
                          label={record.isValid ? "Valid" : "Invalid"}
                          color={record.isValid ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://ipfs.io/ipfs/${record.ipfsCid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {record.ipfsCid}
                        </a>
                      </TableCell>
                      <TableCell>{record.encryptedSymmetricKey}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ color: "#00796b", borderColor: "#00796b" }}
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Requester</TableCell>
                  <TableCell>Request ID</TableCell>
                  <TableCell>IPFS CID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Request Date</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Incentive Amount</TableCell>
                  <TableCell>Incentive-Based</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissionRequests.map((request) => {
                  return (
                    <TableRow key={request.requestId}>
                      <TableCell>{request.requester}</TableCell>{" "}
                      {/* Requester */}
                      <TableCell>{request.requestId}</TableCell>{" "}
                      {/* Request ID */}
                      <TableCell>{request.ipfsCid || "N/A"}</TableCell>{" "}
                      {/* IPFS CID */}
                      <TableCell>
                        <Chip
                          label={request.status}
                          color={
                            request.status === "PENDING" ? "warning" : "success"
                          }
                          size="small"
                        />
                      </TableCell>{" "}
                      {/* Status */}
                      <TableCell>
                        {request.requestDate
                          ? format(
                              new Date(request.requestDate * 1000),
                              "MM/dd/yyyy"
                            )
                          : "Invalid Date"}
                      </TableCell>{" "}
                      {/* Request Date */}
                      <TableCell>
                        {request.expiryDate
                          ? format(
                              new Date(request.expiryDate * 1000),
                              "MM/dd/yyyy"
                            )
                          : "Invalid Date"}
                      </TableCell>{" "}
                      {/* Expiry Date */}
                      <TableCell>
                        {formatEther(request.incentiveAmount)} ETH
                      </TableCell>{" "}
                      {/* Incentive Amount */}
                      <TableCell>
                        {request.isIncentiveBased ? "Yes" : "No"}
                      </TableCell>{" "}
                      {/* Incentive-Based */}
                      <TableCell>
                        {request.status === "Pending" && (
                          <>
                            <Button
                              variant="contained"
                              size="small"
                              sx={{ backgroundColor: "#00796b", mr: 1 }}
                              onClick={() => {
                                setSelectedRequestId(request.requestId);
                                setOpenPrivateKeyDialog(true);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={() =>
                                handleRequestAction(
                                  request.requestId,
                                  "decline"
                                )
                              }
                            >
                              Decline
                            </Button>
                          </>
                        )}
                      </TableCell>{" "}
                      {/* Actions */}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog
          open={openUploadDialog}
          onClose={() => handleUploadDialog(false)}
        >
          <FileUploader
            onClose={() => handleUploadDialog(false)}
            onUpload={handleNewRecord}
            userRole={"Patient"}
          />
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

        <Dialog
          open={openPrivateKeyDialog}
          onClose={() => setOpenPrivateKeyDialog(false)}
        >
          <Box p={3} width={400}>
            <Typography variant="h6" mb={2}>
              Enter Private Key
            </Typography>
            <input
              type="password"
              placeholder="Private Key"
              value={ownerPrivateKey}
              onChange={(e) => setOwnerPrivateKey(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "16px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={() => setOpenPrivateKeyDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                sx={{ backgroundColor: "#00796b" }}
                onClick={() => {
                  approvePermission(selectedRequestId, ownerPrivateKey);
                  setOpenPrivateKeyDialog(false);
                }}
              >
                Submit
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Box>
    </Box>
  );
};

export default PatientDashboard;
