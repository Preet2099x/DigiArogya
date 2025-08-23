// src/components/files/FileUploader.js

import { Button, CircularProgress, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import CryptoJS from 'crypto-js';
import { BrowserProvider, ethers } from 'ethers';
import React, { useState } from 'react';
import contractABI from '../../contractABI.json';
import { encryptSymmetricKey } from '../../services/cryptography/asymmetricEncryption';
import encryptFileToBase64 from '../../services/cryptography/fileEncrypter';
import { uploadToIPFS } from '../../services/ipfs/ipfsUploader';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

// MODIFICATION 1: Accept the new 'fixedDataType' prop
const FileUploader = ({ onClose, onUpload, userRole, fixedDataType }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // MODIFICATION 2: Use 'fixedDataType' if it exists, otherwise default to '1' (PHR)
    const [dataType, setDataType] = useState(fixedDataType || '1'); 

    const [error, setError] = useState('');
    const [patientAddress, setPatientAddress] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    // This handler is no longer needed if the dropdown is hidden, but we keep it for reusability
    const handleDataTypeChange = (event) => setDataType(event.target.value);

    const handlePatientAddressChange = (event) => setPatientAddress(event.target.value);

    const handleFileUpload = async () => {
        if (!selectedFile || !dataType) {
            setError('Please select both a file and data type.');
            return;
        }

        if (userRole === 'Provider' && !patientAddress) {
            setError('Please enter a valid patient address.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
            const publicKeyForEncryption = await contract.getKeyPair(await signer.getAddress());
            const symmetricKey = CryptoJS.lib.WordArray.random(32).toString();
            const base64Content = await encryptFileToBase64(selectedFile, symmetricKey);
            const encryptedSymmetricKey = await encryptSymmetricKey(symmetricKey, publicKeyForEncryption);

            const ipfsPayload = {
                encryptedContent: base64Content,
                fileName: selectedFile.name,
                fileType: selectedFile.type
            };
            
            const dataToUpload = JSON.stringify(ipfsPayload);
            const fileBlob = new Blob([dataToUpload], { type: 'application/json' });

            const uploadResult = await uploadToIPFS({ file: fileBlob, userPublicKey: await signer.getAddress() });
            
            if (!uploadResult || !uploadResult.ipfsHash) {
                throw new Error("Failed to upload to IPFS or get a valid hash.");
            }

            const ipfsCid = uploadResult.ipfsHash;
            console.log("Uploaded to IPFS with CID:", ipfsCid);

            const dataTypeAsNumber = Number(dataType);
            let tx;
            if (userRole === 'Patient') {
                tx = await contract.addPHRData(ipfsCid, dataTypeAsNumber, encryptedSymmetricKey);
            } else { // Provider role
                tx = await contract.addEHRData(patientAddress, ipfsCid, dataTypeAsNumber, encryptedSymmetricKey);
            }
            await tx.wait();

            alert('Record uploaded successfully!');
            // onUpload && onUpload();
            // onClose && onClose();

        } catch (error) {
            console.error('Error during upload process:', error);
            setError(error.message || 'Error uploading file. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <DialogTitle>Upload Health Record</DialogTitle>
            <DialogContent>
                <TextField
                    type="file"
                    onChange={handleFileChange}
                    fullWidth
                    margin="normal"
                    error={!!error}
                    helperText={error}
                />
                
                {/* MODIFICATION 3: Conditionally render the dropdown. Hide it if 'fixedDataType' is provided. */}
                {!fixedDataType && (
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="data-type-label">Data Type</InputLabel>
                        <Select
                            labelId="data-type-label"
                            value={dataType}
                            onChange={handleDataTypeChange}
                            label="Data Type"
                        >
                            <MenuItem value={'1'}>PHR (Personal Health Record)</MenuItem>
                            <MenuItem value={'3'}>Prescription</MenuItem>
                            <MenuItem value={'2'}>Lab Result</MenuItem>
                            <MenuItem value={'4'}>Imaging</MenuItem>
                        </Select>
                        <FormHelperText>Select the type of health data</FormHelperText>
                    </FormControl>
                )}

                {userRole === "Provider" && (
                    <TextField
                        label="Patient Address"
                        value={patientAddress}
                        onChange={handlePatientAddressChange}
                        fullWidth
                        margin="normal"
                        placeholder="Enter patient's wallet address"
                        error={!patientAddress && !!error}
                        helperText={!patientAddress && error ? "Patient address is required for providers." : ""}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button
                    onClick={handleFileUpload}
                    variant="contained"
                    color="primary"
                    disabled={!selectedFile || !dataType || loading}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    {loading ? 'Uploading...' : 'Upload'}
                </Button>
            </DialogActions>
        </>
    );
};

export default FileUploader;