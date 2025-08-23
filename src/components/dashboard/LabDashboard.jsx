import { Box, Typography } from "@mui/material";
import React from "react";
import FileUploader from "../files/FileUploader";
import LogoutButton from "../ui/LogoutButton";

const LabDashboard = () => {
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
            Lab Dashboard
          </Typography>
          <div>
            <LogoutButton />
          </div>
        </Box>

        {/* The FileUploader component is now the primary feature of this dashboard */}
        <FileUploader userRole={"Provider"} />
        
      </Box>
    </Box>
  );
};

export default LabDashboard;