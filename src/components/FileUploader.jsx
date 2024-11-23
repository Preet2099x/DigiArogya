import React, { useState } from 'react';
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    FormHelperText
} from '@mui/material';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { ethers, BrowserProvider } from 'ethers';
import contractABI from '../contractABI.json';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;  // Replace with your deployed contract address

const FileUploader = ({ onClose, onUpload }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ipfsHash, setIpfsHash] = useState('');
    const [dataType, setDataType] = useState('PHR');  // Default DataType is PHR
    const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
    const pinataApiSecret = process.env.REACT_APP_PINATA_API_SECRET;

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    const handleDataTypeChange = (event) => {
        setDataType(event.target.value);
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            alert('Please select a file to upload.');
            return;
        }

        setLoading(true);
        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userPublicKey = await signer.getAddress();

            // Encrypt the file with a symmetric key (for privacy)
            const symmetricKey = CryptoJS.lib.WordArray.random(32).toString();
            const fileData = await selectedFile.text();
            const encryptedData = CryptoJS.AES.encrypt(fileData, symmetricKey).toString();

            // Create a hash of the encrypted data for identification
            const hashIndex = CryptoJS.SHA256(encryptedData).toString();

            // Create metadata for the IPFS pinning
            const metadata = JSON.stringify({
                publicKey: userPublicKey,
                dataType: dataType,
                hashIndex,
                encryptedData,
            });

            // Pin the metadata to IPFS using Pinata
            const ipfsResponse = await axios.post(
                'https://api.pinata.cloud/pinning/pinJSONToIPFS',
                { pinataContent: metadata },
                {
                    headers: {
                        pinata_api_key: pinataApiKey,
                        pinata_secret_api_key: pinataApiSecret,
                    },
                }
            );

            const ipfsHash = ipfsResponse.data.IpfsHash;
            setIpfsHash(ipfsHash);

            // Prepare transaction data for signing
            const transactionData = JSON.stringify({
                publicKey: userPublicKey,
                dataType: dataType,
                hashIndex,
            });

            // Sign the transaction data with the user's Ethereum private key
            const signature = await signer.signMessage(transactionData);

            // Interact with blockchain and add the record
            const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
            const dataTypeEnum = getDataTypeEnum(dataType);

            // Call addPHRData function from the smart contract
            const tx = await contract.addPHRData(ipfsHash, dataTypeEnum, {
                gasLimit: 500000 // Adjust gas limit if necessary
            });
            await tx.wait();  // Wait for the transaction to be mined

            // After successful blockchain interaction, call the onUpload callback
            onUpload({ ipfsHash, dataType, owner: userPublicKey, signature });

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file. Please try again.');
        } finally {
            setLoading(false);
            onClose();
        }
    };

    const getDataTypeEnum = (dataType) => {
        switch (dataType) {
            case 'EHR':
                return 0;  // EHR corresponds to 0 in your contract
            case 'PHR':
                return 1;  // PHR corresponds to 1
            case 'LAB_RESULT':
                return 2;  // LAB_RESULT corresponds to 2
            case 'PRESCRIPTION':
                return 3;  // PRESCRIPTION corresponds to 3
            case 'IMAGING':
                return 4;  // IMAGING corresponds to 4
            default:
                return 1;  // Default to PHR
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
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleFileUpload}
                    variant="contained"
                    color="primary"
                    disabled={!selectedFile || loading}
                >
                    {loading ? 'Uploading...' : 'Upload'}
                </Button>
            </DialogActions>
        </>
    );
};

export default FileUploader;
