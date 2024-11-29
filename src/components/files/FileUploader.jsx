import { Button, CircularProgress, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import CryptoJS from 'crypto-js';
import { BrowserProvider, ethers } from 'ethers';
import React, { useState } from 'react';
import contractABI from '../../contractABI.json';
import { encryptSymmetricKey } from '../../services/cryptography/asymmetricEncryption';
import encryptFileToBase64 from '../../services/cryptography/fileEncrypter';
import { uploadToIPFS } from '../../services/ipfs/ipfsUploader';
import { addElectronicHealthRecord } from '../../services/transactions/electronicHealthRecordAdd';
import { addPatientRecord } from '../../services/transactions/patientRecordAdd';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const FileUploader = ({ onClose, onUpload, userRole }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dataType, setDataType] = useState('PHR');
    const [error, setError] = useState('');
    const [patientAddress, setPatientAddress] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

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
        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userPublicKey = await signer.getAddress();
            const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
            const publicKeyForEncryption = await contract.getKeyPair(userPublicKey);
            const symmetricKey = CryptoJS.lib.WordArray.random(32).toString();
            console.log('Symmetric key:', symmetricKey);
            const base64Content = await encryptFileToBase64(selectedFile, symmetricKey);
            const encryptedSymmetricKey = await encryptSymmetricKey(symmetricKey, publicKeyForEncryption);
            console.log(`Encrypted Symmetric Key from File Uploader is ${encryptedSymmetricKey}`);
            const formData = new FormData();
            const fileBlob = new Blob([JSON.stringify({
                fileName: selectedFile.name,
                fileType: selectedFile.type,
                dataType: dataType,
                encryptedContent: base64Content,
                timestamp: Date.now()
            })], { type: 'application/json' });

            formData.append('file', fileBlob, 'metadata.json');
            const uploadResponse = await uploadToIPFS({ file: fileBlob, userPublicKey, onUpload });
            console.log(uploadResponse);

            if (userRole === 'Patient') {
                console.log('Uploading as Patient...');
                const createTxn = await addPatientRecord(userPublicKey, dataType, uploadResponse, signer, contractAddress, contractABI.abi, onUpload, encryptedSymmetricKey);
                console.log(createTxn);
            }
            if (userRole === 'Provider') {
                console.log('Uploading as Provider...');

                const encryptedSymmetricKey = "b2f7e1dcb5a785d6a17a473b2c8d0809ef9a60442ed9f50c8e96d5194c7f9b0f";
                const createTxn = await addElectronicHealthRecord(userPublicKey, patientAddress, dataType, uploadResponse, encryptedSymmetricKey, signer, contractAddress, contractABI.abi, onUpload);
                console.log(createTxn);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
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
                <FormControl fullWidth margin="normal">
                    <InputLabel id="data-type-label">Data Type</InputLabel>
                    <Select
                        labelId="data-type-label"
                        value={dataType}
                        onChange={handleDataTypeChange}
                        label="Data Type"
                    >
                        <MenuItem value="EHR">EHR (Electronic Health Record)</MenuItem>
                        <MenuItem value="PHR">PHR (Personal Health Record)</MenuItem>
                        <MenuItem value="LAB_RESULT">Lab Result</MenuItem>
                        <MenuItem value="PRESCRIPTION">Prescription</MenuItem>
                        <MenuItem value="IMAGING">Imaging</MenuItem>
                    </Select>
                    <FormHelperText>Select the type of health data</FormHelperText>
                </FormControl>
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
