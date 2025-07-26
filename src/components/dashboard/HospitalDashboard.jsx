import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Box, Tab, Tabs, Typography, Button, Paper } from '@mui/material';
import { LocalHospital, Hotel, MedicalServices } from '@mui/icons-material';
import { ethers, BrowserProvider } from 'ethers';
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
  // 1. Hooks are defined first.
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [floors, setFloors] = useState([]);
  const [doctors, setDoctors] = useState([
    { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', isAvailable: true },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Neurology', isAvailable: true },
    { id: 3, name: 'Dr. Emily Williams', specialty: 'Pediatrics', isAvailable: false },
    { id: 4, name: 'Dr. James Wilson', specialty: 'Orthopedics', isAvailable: true },
    { id: 5, name: 'Dr. Maria Garcia', specialty: 'Dermatology', isAvailable: false },
    { id: 6, name: 'Dr. Robert Taylor', specialty: 'Oncology', isAvailable: true }
  ]);

  // 2. Functions are defined next.
  const fetchBedData = async () => {
    try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
        
        const hospitalAddress = await signer.getAddress();
        const floorIds = await contract.hospitalFloorIds(hospitalAddress);

        const floorsData = await Promise.all(
          floorIds.map(async (floorId) => {
            const floorIdNum = Number(floorId);
            const floorName = await contract.hospitalFloorNames(hospitalAddress, floorIdNum);
            const roomTypes = await contract.hospitalRoomTypes(hospitalAddress, floorIdNum);
            
            const rooms = {};
            await Promise.all(
              roomTypes.map(async (type) => {
                const roomInfo = await contract.getRoomInfo(hospitalAddress, floorIdNum, type);
                rooms[type] = {
                  total: Number(roomInfo.total),
                  available: Number(roomInfo.available)
                };
              })
            );
            
            return { id: floorIdNum, name: floorName, rooms: rooms };
          })
        );
        
        setFloors(floorsData);

    } catch (error) {
      console.error("Failed to fetch bed data:", error);
      toast.error("Could not load bed data from the blockchain.");
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  const updateBedCount = async (floorId, roomType, change) => {
    const isIncrement = change > 0;
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      
      toast.info("Submitting transaction to update bed count...");

      const tx = await contract.updateBedCount(floorId, roomType, isIncrement);
      await tx.wait();
      
      toast.success("Bed count updated successfully!");
      
      await fetchBedData();

    } catch (error) {
        console.error("Error updating bed count:", error);
        const reason = error.reason || "Transaction failed.";
        toast.error(`Update failed: ${reason}`);
    }
  };

  // 3. useEffect hooks are defined last.
  useEffect(() => {
    if (tabValue === 1) {
      fetchBedData();
    }
  }, [tabValue]);

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
            {floors.length > 0 ? (
              floors.map(floor => (
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
                        <div className="flex gap-2">
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => updateBedCount(floor.id, type, -1)}
                          >
                            -1
                          </Button>
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            onClick={() => updateBedCount(floor.id, type, 1)}
                          >
                            +1
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Paper>
              ))
            ) : (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                No floor data found for this hospital. Please add a floor to begin.
              </Typography>
            )}
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
    </Box>
  );
};

export default HospitalDashboard;