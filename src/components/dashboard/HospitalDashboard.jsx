import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
    Box, Tab, Tabs, Typography, Button, Paper, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, TextField, CircularProgress,
    Grid, IconButton, Card, CardContent
} from '@mui/material';
import { LocalHospital, Hotel, MedicalServices, ArrowBack } from '@mui/icons-material';
import { BrowserProvider, ethers } from 'ethers';
import contractABI from '../../contractABI.json';
import LogoutButton from '../ui/LogoutButton';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

// Structured data for specialties, doctors, and their available times
const specialtiesData = {
  'Cardiology': [
    { id: 1, name: 'Dr. Sarah Johnson', availableTimes: ['10:00 AM', '11:30 AM', '02:00 PM'] },
    { id: 7, name: 'Dr. David Lee', availableTimes: ['09:30 AM', '01:00 PM', '03:00 PM'] },
  ],
  'Neurology': [ { id: 2, name: 'Dr. Michael Chen', availableTimes: ['09:00 AM', '10:30 AM'] } ],
  'Pediatrics': [ { id: 3, name: 'Dr. Emily Williams', availableTimes: ['11:00 AM', '02:30 PM', '04:00 PM'] } ],
  'Orthopedics': [ { id: 4, name: 'Dr. James Wilson', availableTimes: ['10:00 AM', '12:00 PM'] } ],
  'Dermatology': [ { id: 5, name: 'Dr. Maria Garcia', availableTimes: ['01:30 PM', '03:30 PM'] } ],
  'Oncology': [ { id: 6, name: 'Dr. Robert Taylor', availableTimes: ['09:00 AM', '11:00 AM', '01:00 PM'] } ]
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const HospitalDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isBooking, setIsBooking] = useState(false);
  const [patientInfo, setPatientInfo] = useState({ name: '', age: '', address: '' });

  // State for Bed Booking
  const [bedDialogOpen, setBedDialogOpen] = useState(false);
  const [bedBookingDetails, setBedBookingDetails] = useState(null);
  const [floors, setFloors] = useState([
    { id: 1, name: 'Ground Floor', rooms: { general: { total: 20, available: 15 }, private: { total: 10, available: 7 }, icu: { total: 5, available: 3 } } },
    { id: 2, name: 'First Floor', rooms: { general: { total: 25, available: 18 }, private: { total: 15, available: 10 }, icu: { total: 8, available: 0 } } },
  ]);

  // State for Doctor Booking process
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({ doctor: null, time: null });

  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handlePatientInfoChange = (e) => setPatientInfo({ ...patientInfo, [e.target.name]: e.target.value });

  // --- Bed Booking Handlers ---
  const handleOpenBedDialog = (floor, roomType) => {
    setBedBookingDetails({ floorId: floor.id, floorName: floor.name, roomType: roomType });
    setBedDialogOpen(true);
  };
  const handleCloseBedDialog = () => {
    setBedDialogOpen(false);
    setPatientInfo({ name: '', age: '', address: '' });
  };
   const handleConfirmBedBooking = async () => {
    if (!patientInfo.address || !ethers.isAddress(patientInfo.address)) {
        toast.error("Please enter a valid patient wallet address.");
        return;
    }
    
    // Check if patient name is provided
    if (!patientInfo.name.trim()) {
        toast.error("Please enter patient name.");
        return;
    }
    
    // Verify bed is available before proceeding
    const floor = floors.find(f => f.id === bedBookingDetails.floorId);
    const roomType = bedBookingDetails.roomType.toLowerCase();
    
    if (!floor || !floor.rooms[roomType] || floor.rooms[roomType].available <= 0) {
        toast.error("This bed type is no longer available.");
        handleCloseBedDialog();
        return;
    }
    
    setIsBooking(true);
    try {
        // Validate patient address
        if (!patientInfo.address || !ethers.isAddress(patientInfo.address)) {
            toast.error("Please enter a valid patient wallet address");
            return;
        }

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

        const hospitalName = "Central City Hospital";
        const appointmentDetails = `BED|${bedBookingDetails.roomType}|${bedBookingDetails.floorName}`;

        toast.info("Processing bed booking transaction...");
        
        // Proceed with the transaction directly
        const tx = await contract.bookAppointment(patientInfo.address, hospitalName, appointmentDetails, {
            gasLimit: 500000 // Set a higher gas limit to ensure transaction goes through
        });
        
        toast.info("Transaction submitted. Waiting for confirmation...");
        await tx.wait();

        // Update the available bed count after successful booking
        setFloors(prevFloors => prevFloors.map(floor => {
            if (floor.id === bedBookingDetails.floorId) {
                const updatedRooms = {
                    ...floor.rooms,
                    [roomType]: {
                        ...floor.rooms[roomType],
                        available: Math.max(0, floor.rooms[roomType].available - 1)
                    }
                };
                return { ...floor, rooms: updatedRooms };
            }
            return floor;
        }));

        toast.success(`Bed booked successfully for ${patientInfo.name}.`);
        handleCloseBedDialog();
    } catch (error) {
        console.error("Error booking bed:", error);
        if (error.code === 'ACTION_REJECTED') {
            toast.error("Transaction was rejected by the user.");
        } else {
            toast.error(error?.reason || "Failed to book bed. Please try again.");
        }
    } finally {
        setIsBooking(false);
    }
  };


  // --- Doctor Booking Handlers ---
  const handleSpecialtySelect = (specialty) => setSelectedSpecialty(specialty);
  const handleOpenDoctorDialog = (doctor, time) => {
    setBookingDetails({ doctor, time });
    setDoctorDialogOpen(true);
  };
  const handleCloseDoctorDialog = () => {
    setDoctorDialogOpen(false);
    setPatientInfo({ name: '', age: '', address: '' });
  };
  const handleBackToSpecialties = () => setSelectedSpecialty(null);
  const handleConfirmDoctorBooking = async () => {
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
      const appointmentDetails = `DOCTOR|${bookingDetails.doctor.name}|${selectedSpecialty}|${bookingDetails.time}`;

      toast.info("Processing appointment transaction...");
      const tx = await contract.bookAppointment(patientInfo.address, hospitalName, appointmentDetails);
      await tx.wait();

      toast.success(`Appointment with ${bookingDetails.doctor.name} at ${bookingDetails.time} booked for ${patientInfo.name}.`);
      handleCloseDoctorDialog();
      setSelectedSpecialty(null);
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error(error?.reason || "Failed to book appointment.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Header and Tabs */}
      <Box sx={{ p: 3, background: 'linear-gradient(120deg, #00796b 0%, #004d40 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems:'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocalHospital sx={{ fontSize: 40 }} />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>Hospital Dashboard</Typography>
          </Box>
          <LogoutButton sx={{ ml: 'auto' }} />
        </Box>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)', '&.Mui-selected': { color: 'white' }}, '& .MuiTabs-indicator': { backgroundColor: 'white' }}}>
          <Tab icon={<LocalHospital />} label="Doctors" />
          <Tab icon={<Hotel />} label="Beds" />
          <Tab icon={<MedicalServices />} label="Services" />
        </Tabs>
      </Box>

      <Box sx={{ p: { xs: 2, md: 4 } }}>
        {/* Doctors Tab */}
        <TabPanel value={tabValue} index={0}>
            {/* ... Doctor booking UI from previous step ... */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {selectedSpecialty && (
                <IconButton onClick={handleBackToSpecialties} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                )}
                <Typography variant="h6" sx={{ color: '#00796b' }}>
                {!selectedSpecialty ? "Choose a Specialty" : `Doctors in ${selectedSpecialty}`}
                </Typography>
            </Box>

            {!selectedSpecialty ? (
                <Grid container spacing={2}>
                    {Object.keys(specialtiesData).map(specialty => (
                        <Grid item xs={12} sm={6} md={4} key={specialty}>
                        <Paper
                            onClick={() => handleSpecialtySelect(specialty)}
                            sx={{ p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 6, transform: 'scale(1.02)' }, transition: 'all 0.2s' }}
                        >
                            <Typography variant="h6">{specialty}</Typography>
                        </Paper>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Grid container spacing={3}>
                {specialtiesData[selectedSpecialty].map(doctor => (
                    <Grid item xs={12} sm={6} md={4} key={doctor.id}>
                    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h5" component="div">
                            {doctor.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {selectedSpecialty}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" component="div" sx={{ mb: 1 }}>
                            Available Slots:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {doctor.availableTimes.map(time => (
                                <Button
                                key={time}
                                variant="outlined"
                                size="small"
                                onClick={() => handleOpenDoctorDialog(doctor, time)}
                                >
                                {time}
                                </Button>
                            ))}
                            </Box>
                        </Box>
                        </CardContent>
                    </Card>
                    </Grid>
                ))}
                </Grid>
            )}
        </TabPanel>

        {/* Beds Tab */}
        <TabPanel value={tabValue} index={1}>
           {/* ✅ Bed Management UI is now fully restored here */}
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
                          onClick={() => handleOpenBedDialog(floor, type)}
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
        
        {/* Services Tab */}
        <TabPanel value={tabValue} index={2}>
             <Typography variant="h6" gutterBottom sx={{ color: '#00796b', mb: 3 }}>
               Available Services
             </Typography>
             {/* ... Your Services UI can go here ... */}
        </TabPanel>
      </Box>

      {/* Bed Booking Dialog */}
       <Dialog open={bedDialogOpen} onClose={handleCloseBedDialog}>
        <DialogTitle>Book a Bed</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please enter the patient's details to book a {bedBookingDetails?.roomType} bed on the {bedBookingDetails?.floorName}.
          </DialogContentText>
          <TextField autoFocus margin="dense" name="name" label="Patient Name" type="text" fullWidth variant="standard" value={patientInfo.name} onChange={handlePatientInfoChange} />
          <TextField margin="dense" name="age" label="Patient Age" type="number" fullWidth variant="standard" value={patientInfo.age} onChange={handlePatientInfoChange} />
          <TextField margin="dense" name="address" label="Patient Wallet Address" type="text" fullWidth variant="standard" value={patientInfo.address} onChange={handlePatientInfoChange} required />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBedDialog} disabled={isBooking}>Cancel</Button>
          <Button onClick={handleConfirmBedBooking} variant="contained" color="success" disabled={isBooking}>
            {isBooking ? <CircularProgress size={24} color="inherit" /> : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Doctor Booking Dialog */}
      <Dialog open={doctorDialogOpen} onClose={handleCloseDoctorDialog}>
        <DialogTitle>Confirm Appointment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Booking an appointment for a patient with <strong>{bookingDetails.doctor?.name}</strong> at <strong>{bookingDetails.time}</strong>. Please enter the patient's details.
          </DialogContentText>
          <TextField autoFocus margin="dense" name="name" label="Patient Name" type="text" fullWidth variant="standard" value={patientInfo.name} onChange={handlePatientInfoChange} />
          <TextField margin="dense" name="age" label="Patient Age" type="number" fullWidth variant="standard" value={patientInfo.age} onChange={handlePatientInfoChange} />
          <TextField margin="dense" name="address" label="Patient Wallet Address" type="text" fullWidth variant="standard" value={patientInfo.address} onChange={handlePatientInfoChange} required />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDoctorDialog} disabled={isBooking}>Cancel</Button>
          <Button onClick={handleConfirmDoctorBooking} variant="contained" sx={{ bgcolor: '#00796b' }} disabled={isBooking}>
            {isBooking ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HospitalDashboard;