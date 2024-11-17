import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <Box p={6} maxWidth="md" mx="auto" textAlign="center">
      <Typography variant="h3" fontWeight="bold" mb={4}>
        Dashboard
      </Typography>

      <Box display="flex" justifyContent="center" gap={4} mt={4}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/dashboard/patient')}
        >
          Patient
        </Button>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={() => navigate('/dashboard/doctor')}
        >
          Doctor
        </Button>
      </Box>
    </Box>
  );
};

export default Dashboard;
