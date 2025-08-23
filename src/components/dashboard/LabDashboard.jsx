// src/components/dashboard/LabDashboard.js

import ScienceIcon from '@mui/icons-material/Science';
import { Box, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";
import React from "react";
import FileUploader from "../files/FileUploader";
import LogoutButton from "../ui/LogoutButton";

const LabDashboard = () => {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh", // Use minHeight to ensure background covers the screen
        p: 4, // Increased padding for better spacing
        backgroundColor: "#f4f6f9",
      }}
    >
      <Box
        sx={{
          maxWidth: "1200px",
          mx: "auto",
        }}
      >
        {/* IMPROVEMENT 1: Enhanced Header with Icon and Subtitle */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1} // Reduced margin-bottom to bring subtitle closer
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ScienceIcon color="primary" sx={{ fontSize: '2.5rem' }} />
            <Typography variant="h4" fontWeight="bold">
              Lab Dashboard
            </Typography>
          </Box>
          <LogoutButton />
        </Box>
        <Typography variant="subtitle1" color="text.secondary" mb={4}>
          Upload and manage patient lab results securely.
        </Typography>

        {/* IMPROVEMENT 2: Use Paper for a clean, card-like container */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 4, // Softer corners
            boxShadow: 'rgba(149, 157, 165, 0.1) 0px 8px 24px' // Softer shadow
          }}
        >
          <Typography variant="h6" fontWeight={600} mb={3}>
            Upload New Lab Result
          </Typography>

          {/* IMPROVEMENT 3: Use Stack for organized vertical spacing */}
          <Stack spacing={3}>
            <FormControl fullWidth sx={{ maxWidth: "400px" }}>
              <InputLabel id="test-type-label">Type of Test</InputLabel>
              <Select
                labelId="test-type-label"
                label="Type of Test"
                defaultValue=""
              >
                <MenuItem value={'Blood Test'}>Blood Test</MenuItem>
                <MenuItem value={'Urine Test'}>Urine Test</MenuItem>
                <MenuItem value={'X-Ray'}>X-Ray</MenuItem>
                <MenuItem value={'CT Scan'}>CT Scan</MenuItem>
                <MenuItem value={'MRI'}>MRI</MenuItem>
              </Select>
            </FormControl>

            {/* IMPROVEMENT 4: A styled container makes the uploader's purpose clearer */}
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                backgroundColor: '#fafafa'
              }}
            >
              <FileUploader userRole={"Provider"} fixedDataType={'2'} />
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default LabDashboard;