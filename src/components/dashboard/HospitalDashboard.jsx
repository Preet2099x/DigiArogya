import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    Box, Tab, Tabs, Typography, Button, Paper, Dialog, DialogActions, 
    DialogContent, DialogContentText, DialogTitle, TextField, CircularProgress, 
    Grid, IconButton, Card, CardContent 
} from '@mui/material';
import { LocalHospital, Hotel, MedicalServices, ArrowBack } from '@mui/icons-material';
import { BrowserProvider, ethers } from 'ethers';
import contractABI from '../../contractABI.json';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

// Structured data for specialties, doctors, and their available times
const specialtiesData = {
  'Cardiology': [
    { id: 1, name: 'Dr. Sarah Johnson', availableTimes: ['10:00 AM', '11:30 AM', '02:00 PM'] },
    { id: 7, name: 'Dr. David Lee', availableTimes: ['09:30 AM', '01:00 PM', '03:00 PM'] },
  ],
  'Neurology': [
    { id: 2, name: 'Dr. Michael Chen', availableTimes: ['09:00 AM', '10:30 AM'] },
  ],
  'Pediatrics': [
    { id: 3, name: 'Dr. Emily Williams', availableTimes: ['11:00 AM', '02:30 PM', '04:00 PM'] },
  ],
  'Orthopedics': [
    { id: 4, name: 'Dr. James Wilson', availableTimes: ['10:00 AM', '12:00 PM'] },
  ],
  'Dermatology': [
    { id: 5, name: 'Dr. Maria Garcia', availableTimes: ['01:30 PM', '03:30 PM'] },
  ],
  'Oncology': [
    { id: 6, name: 'Dr. Robert Taylor', availableTimes: ['09:00 AM', '11:00 AM', '01:00 PM'] },
  ]
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
  const handleConfirmBedBooking = async () => { /* ... existing logic ... */ };

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
  
  const handleBackToSpecialties = () => {
    setSelectedSpecialty(null);
  };

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
      const appointmentType = `Consultation at ${bookingDetails.time}`;

      toast.info("Processing appointment transaction...");
      const tx = await contract.bookAppointment(patientInfo.address, hospitalName, appointmentType);
      await tx.wait();

      toast.success(`Appointment with ${bookingDetails.doctor.name} at ${bookingDetails.time} booked for ${patientInfo.name}.`);
      handleCloseDoctorDialog();
      setSelectedSpecialty(null); // Go back to specialties list
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <LocalHospital sx={{ fontSize: 40 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>Hospital Dashboard</Typography>
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

        {/* Beds and Services Tabs */}
        <TabPanel value={tabValue} index={1}>{/* Bed Management UI */}</TabPanel>
        <TabPanel value={tabValue} index={2}>{/* Services UI */}</TabPanel>
      </Box>

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