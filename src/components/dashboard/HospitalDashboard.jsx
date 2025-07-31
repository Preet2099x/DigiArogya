import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Box, Tab, Tabs, Typography, Button, Paper, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, CircularProgress } from '@mui/material';
import { LocalHospital, Hotel, MedicalServices } from '@mui/icons-material';
import { BrowserProvider, ethers } from 'ethers';
import contractABI from '../../contractABI.json';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hospital-tabpanel-${index}`}
      aria-labelledby={`hospital-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [patientInfo, setPatientInfo] = useState({ name: '', age: '', address: '' });
  const [isBooking, setIsBooking] = useState(false);
  const [floors, setFloors] = useState([
    {
      id: 1,
      name: 'Ground Floor',
      rooms: {
        general: { total: 20, available: 15 },
        private: { total: 10, available: 7 },
        icu: { total: 5, available: 3 }
      }
    },
    {
      id: 2,
      name: 'First Floor',
      rooms: {
        general: { total: 25, available: 18 },
        private: { total: 15, available: 10 },
        icu: { total: 8, available: 0 }
      }
    },
    {
      id: 3,
      name: 'Second Floor',
      rooms: {
        general: { total: 15, available: 12 },
        private: { total: 12, available: 8 },
        icu: { total: 6, available: 4 }
      }
    }
  ]);
  const [doctors, setDoctors] = useState([
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', isAvailable: true },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Neurology', isAvailable: true },
    { id: 3, name: 'Dr. Emily Williams', specialty: 'Pediatrics', isAvailable: false },
    { id: 4, name: 'Dr. James Wilson', specialty: 'Orthopedics', isAvailable: true },
    { id: 5, name: 'Dr. Maria Garcia', specialty: 'Dermatology', isAvailable: false },
    { id: 6, name: 'Dr. Robert Taylor', specialty: 'Oncology', isAvailable: true }
  ]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleOpenDialog = (floor, roomType) => {
    setBookingDetails({ floorId: floor.id, floorName: floor.name, roomType: roomType });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setPatientInfo({ name: '', age: '', address: '' }); // Reset form
    setBookingDetails(null);
  };

  const handlePatientInfoChange = (e) => {
    setPatientInfo({
      ...patientInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleConfirmBooking = async () => {
    if (!patientInfo.address || !ethers.isAddress(patientInfo.address)) {
        toast.error("Please enter a valid patient wallet address.");
        return;
    }
    setIsBooking(true);
    try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
        
        const hospitalName = "Central City Hospital"; 
        
        const tx = await contract.bookAppointment(patientInfo.address, hospitalName, bookingDetails.roomType);
        toast.info("Processing booking transaction...");
        await tx.wait();

        updateBedCount(bookingDetails.floorId, bookingDetails.roomType, -1);
        
        toast.success(`Bed booked for ${patientInfo.name} in a ${bookingDetails.roomType} room.`);
        handleCloseDialog();
    } catch (error) {
        console.error("Error booking appointment:", error);
        toast.error(error?.reason || "Failed to book appointment.");
    } finally {
        setIsBooking(false);
    }
  };

  const toggleDoctorAvailability = (doctorId) => {
    setDoctors(doctors.map(doctor => {
      if (doctor.id === doctorId) {
        const newStatus = !doctor.isAvailable;
        toast.success(`${doctor.name}'s status updated to ${newStatus ? 'Available' : 'Unavailable'}`);
        return { ...doctor, isAvailable: newStatus };
      }
      return doctor;
    }));
  };

  const updateBedCount = (floorId, roomType, change) => {
    setFloors(prevFloors => {
      return prevFloors.map(floor => {
        if (floor.id === floorId) {
          const newAvailable = floor.rooms[roomType].available + change;
          if (newAvailable >= 0 && newAvailable <= floor.rooms[roomType].total) {
            const updatedRooms = {
              ...floor.rooms,
              [roomType]: {
                ...floor.rooms[roomType],
                available: newAvailable
              }
            };
            return { ...floor, rooms: updatedRooms };
          }
          return floor;
        }
        return floor;
      });
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(120deg, #00796b 0%, #004d40 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <LocalHospital sx={{ fontSize: 40 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Hospital Dashboard
          </Typography>
        </Box>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': { color: 'white' }
            },
            '& .MuiTabs-indicator': { backgroundColor: 'white' }
          }}
        >
          <Tab icon={<LocalHospital />} label="Doctors" />
          <Tab icon={<Hotel />} label="Beds" />
          <Tab icon={<MedicalServices />} label="Services" />
        </Tabs>
      </Box>

      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom sx={{ color: '#00796b', mb: 3 }}>
            Doctors Availability
          </Typography>
          <div className="grid gap-4">
            {doctors.map(doctor => (
              <Paper key={doctor.id} elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="h6" sx={{ color: '#2c3e50' }}>{doctor.name}</Typography>
                    <Typography variant="body2" sx={{ color: '#7f8c8d' }}>{doctor.specialty}</Typography>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${doctor.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                    <Button
                      onClick={() => toggleDoctorAvailability(doctor.id)}
                      variant="outlined"
                      color={doctor.isAvailable ? 'error' : 'success'}
                      size="small"
                    >
                      {doctor.isAvailable ? 'Set Unavailable' : 'Set Available'}
                    </Button>
                  </div>
                </div>
              </Paper>
            ))}
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom sx={{ color: '#00796b', mb: 3 }}>
            Bed Management
          </Typography>
          <div className="grid gap-6">
            {floors.map(floor => (
              <Paper key={floor.id} elevation={1} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: '#2c3e50', mb: 3 }}>{floor.name}</Typography>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(floor.rooms).map(([type, data]) => (
                    <div key={type} className="p-4 border rounded-lg bg-gray-50">
                      <Typography variant="subtitle1" sx={{ color: '#2c3e50', textTransform: 'capitalize', mb: 2 }}>
                        {type} Rooms
                      </Typography>
                      <div className="flex justify-between items-center mb-3">
                        <Typography variant="h4" sx={{ color: '#00796b' }}>{data.available}</Typography>
                        <Typography variant="body2" sx={{ color: '#7f8c8d' }}>of {data.total}</Typography>
                      </div>
                      <div className="flex justify-center">
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          disabled={data.available === 0}
                          onClick={() => handleOpenDialog(floor, type)}
                        >
                          {data.available > 0 ? 'Book Bed' : 'Unavailable'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Paper>
            ))}
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom sx={{ color: '#00796b', mb: 3 }}>
            Available Services
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Emergency Care', description: '24/7 emergency medical services' },
              { name: 'Laboratory', description: 'Comprehensive diagnostic testing' },
              { name: 'Radiology', description: 'Advanced imaging services' },
              { name: 'Surgery', description: 'State-of-the-art surgical facilities' },
              { name: 'Pharmacy', description: '24-hour pharmacy services' },
              { name: 'Physical Therapy', description: 'Rehabilitation services' }
            ].map((service, index) => (
              <Paper key={index} elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: '#2c3e50', mb: 1 }}>{service.name}</Typography>
                <Typography variant="body2" sx={{ color: '#7f8c8d' }}>{service.description}</Typography>
              </Paper>
            ))}
          </div>
        </TabPanel>
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Book a Bed</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please enter the patient's details to book a {bookingDetails?.roomType} bed on the {bookingDetails?.floorName}.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Patient Name"
            type="text"
            fullWidth
            variant="standard"
            value={patientInfo.name}
            onChange={handlePatientInfoChange}
          />
          <TextField
            margin="dense"
            id="age"
            name="age"
            label="Patient Age"
            type="number"
            fullWidth
            variant="standard"
            value={patientInfo.age}
            onChange={handlePatientInfoChange}
          />
          <TextField
            margin="dense"
            id="address"
            name="address"
            label="Patient Wallet Address"
            type="text"
            fullWidth
            variant="standard"
            value={patientInfo.address}
            onChange={handlePatientInfoChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isBooking}>Cancel</Button>
          <Button onClick={handleConfirmBooking} variant="contained" color="success" disabled={isBooking}>
            {isBooking ? <CircularProgress size={24} color="inherit" /> : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HospitalDashboard;