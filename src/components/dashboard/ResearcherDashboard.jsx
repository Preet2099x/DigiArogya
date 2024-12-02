import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../ui/LogoutButton";
import { ToastContainer } from "react-toastify";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  styled,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import contractABI from "../../contractABI.json";
import {
  UserCircle,
  LogOut,
  Search,
  ChevronDown,
  Send,
  Eye,
} from "lucide-react";
import { BrowserProvider, ethers, formatEther, BigNumber } from "ethers";
import { format } from "date-fns"; // Import date formatting utility
import FileDownloader from "../files/FileDownloader";

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

// Custom Theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#3f51b5",
      light: "#7986cb",
      dark: "#303f9f",
    },
    background: {
      default: "#f4f6f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#2c3e50",
      secondary: "#7f8c8d",
    },
  },
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          transition: "box-shadow 0.3s ease",
          "&:hover": {
            boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          fontWeight: 500,
          transition: "all 0.3s ease",
        },
      },
    },
  },
});

const StyledBadge = styled("span")(({ theme, status }) => ({
  padding: "6px 12px",
  borderRadius: "16px",
  fontSize: "0.875rem",
  fontWeight: 500,
  backgroundColor:
    status === "Permitted"
      ? "rgba(46, 125, 50, 0.1)"
      : status === "Pending Permission"
      ? "rgba(255, 152, 0, 0.1)"
      : "rgba(244, 67, 54, 0.1)",
  color:
    status === "Permitted"
      ? "#2e7d32"
      : status === "Pending Permission"
      ? "#f57c00"
      : "#f44336",
  border: `1px solid ${
    status === "Permitted"
      ? "rgba(46, 125, 50, 0.3)"
      : status === "Pending Permission"
      ? "rgba(255, 152, 0, 0.3)"
      : "rgba(244, 67, 54, 0.3)"
  }`,
  transition: "all 0.3s ease",
}));

const ResearcherDashboard = () => {
  const [openPatientDetailDialog, setOpenPatientDetailDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [healthRecords, setHealthRecords] = useState([]);
  const [userPublicKey, setUserPublicKey] = useState("");
  const [accessibleRecords, setAccessibleRecords] = useState([{}]);
  const [hashForDownload, setHashForDownload] = useState("");
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [encryptedSymmetricKey, setEncryptedSymmetricKey] = useState("");
  const [permissionType, setPermissionType] = useState(0);
  const [ipfsCid, setIpfsCid] = useState("");

  useEffect(() => {
    const resizeObserverErrorHandler = (event) => {
      if (event.target && event.target.readyState === "complete") {
        console.warn(
          "ResizeObserver error: Suppressing loop completed undelivered notifications"
        );
      }
    };

    window.addEventListener("error", resizeObserverErrorHandler);

    return () => {
      window.removeEventListener("error", resizeObserverErrorHandler);
    };
  }, []);

  const handleDownloadDialog = (open) => {
    setOpenDownloadDialog(open);
  };

  const handleViewPatientDetails = (patient) => {
    handleDownloadDialog(true);
    setHashForDownload(patient.ipfsCid);
    setEncryptedSymmetricKey(patient.encryptedSymmetricKey);
    setSelectedPatient(patient);
    setOpenPatientDetailDialog(true);
  };

  // Define fetchHealthRecords function
  const fetchHealthRecords = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      // const userPublicKey = await signer.getAddress();

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
        owner: record.owner,
        ipfsCid: record.ipfsCid,
        dataType: dataTypeMap[record.dataType], // Map dataType enum to readable type
        provider: record.provider,
        timestamp: Number(record.timestamp), // Convert BigInt to Number
        isValid: record.isValid,
        encryptedSymmetricKey: record.encryptedSymmetricKey,
      }));
      // setHashForDownload(fetchedRecords.ipfsCid);
      // Reverse the records array to show the latest first
      setHealthRecords(fetchedRecords.reverse());
    } catch (error) {
      console.error("Error fetching health records:", error);
      alert("Error fetching health records. Please try again.");
    }
  };

  // Function for Non-Incentive Based Permission Request
  const handleNonIncentiveBasedRequest = async (ipfsCid) => {
    try {
      console.log(ipfsCid);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      // Interact with the smart contract to fetch records
      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );
      const permissionType = 2;
      console.log(userPublicKey);
      console.log(ipfsCid);
      console.log(permissionType);
      // Call the smart contract method for non-incentive-based permission request
      const tx = await contract.requestNonIncentiveBasedPermission(
        userPublicKey, // The owner address
        ipfsCid, // The IPFS CID
        permissionType
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

  const handleRequest = (patient) => {
    setIpfsCid(patient.ipfsCid);
    console.log(ipfsCid);
    handleNonIncentiveBasedRequest(patient.ipfsCid);
  };

  const handleGetRecord = async (ipfsCid) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Contract details
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS; // Replace with your contract address
      const contract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );

      const record = await contract.getRecordsForResearcher(
        userPublicKey, // The owner address
        ipfsCid // The IPFS CID
      );

      const encryptedSymmetricKey = record.encryptedSymmetricKey;

      setEncryptedSymmetricKey(encryptedSymmetricKey);
      setHashForDownload(ipfsCid);
    } catch (error) {
      console.error("Error fetching the record for researcher:", error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: theme.palette.background.default,
          minHeight: "100vh",
          color: theme.palette.text.primary,
        }}
      >
        {/* App Bar */}
        <AppBar
          position="static"
          color="default"
          elevation={1}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Container maxWidth="lg">
            <Toolbar>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  flexGrow: 1,
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                }}
              >
                Researcher Dashboard
              </Typography>

              <div>
                {/* Render the logout button */}
                <LogoutButton />

                {/* ToastContainer to display toasts */}
                <ToastContainer />
              </div>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Search Section */}
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search patients..."
                  value={userPublicKey}
                  onChange={(e) => setUserPublicKey(e.target.value)}
                  size="small"
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  onClick={(userPublicKey) => fetchHealthRecords(userPublicKey)}
                  sx={{
                    px: 3,
                    py: 1,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  Request Access by Ethereum Address
                </Button>
              </Box>
            </Card>

            {/* Patients Table */}
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: theme.palette.background.default }}>
                  <TableRow>
                    {[
                      "Ethereum Address",
                      "IPFS CID",
                      "Date Created",
                      "Actions",
                    ].map((header) => (
                      <TableCell
                        key={header}
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {healthRecords.map((healthRecord) => (
                    <TableRow key={healthRecord.ipfsCid}>
                      <TableCell>{healthRecord.owner}</TableCell>
                      <TableCell>
                        <a
                          href={`https://ipfs.io/ipfs/${healthRecord.ipfsCid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {healthRecord.ipfsCid}
                        </a>
                      </TableCell>
                      <TableCell>
                        {healthRecord.timestamp
                          ? format(
                              new Date(healthRecord.timestamp * 1000),
                              "MM/dd/yyyy"
                            )
                          : "Invalid Date"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          startIcon={<Eye size={16} />}
                          size="small"
                          onClick={() => handleRequest(healthRecord)}
                          // sx={{
                          // opacity:
                          //   healthRecord.status !== "Permitted" ? 0.5 : 1,
                          // transition: "all 0.3s ease",
                          // }}
                        >
                          Request Permission
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Eye size={16} />}
                          size="small"
                          onClick={() => {
                            handleDownloadDialog(true);
                            setHashForDownload(healthRecord.ipfsCid);
                            handleGetRecord(healthRecord.ipfsCid);
                          }}
                          sx={{
                            opacity:
                              healthRecord.status !== "Permitted" ? 0.5 : 1,
                            transition: "all 0.3s ease",
                          }}
                        >
                          View Data
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Container>

        {/* Patient Details Dialog */}
        <Dialog
          open={openPatientDetailDialog}
          onClose={() => setOpenPatientDetailDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            Patient Research Data Details
            {/* {selectedPatient && ` - ${selectedPatient.name}`} */}
          </DialogTitle>
          <DialogContent>
            {selectedPatient &&
            selectedPatient.status === "Permitted" &&
            selectedPatient.researchData ? (
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              ></Box>
            ) : (
              <Typography>
                No permitted research data available for this patient.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenPatientDetailDialog(false)}
              sx={{
                px: 3,
                "&:hover": {
                  transform: "translateY(-2px)",
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
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
    </ThemeProvider>
  );
};

export default ResearcherDashboard;
