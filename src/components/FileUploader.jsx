import {Button,DialogActions,DialogContent,DialogTitle,FormControl,FormHelperText,InputLabel,MenuItem,Select,TextField} from '@mui/material';
import CryptoJS from 'crypto-js';
import { ethers, BrowserProvider } from 'ethers';
import React, { useState } from 'react';
import contractABI from '../contractABI.json';
import encryptFileToBase64 from '../services/fileEncrypter';
import { uploadToIPFS } from '../services/ipfsUploader';


const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const FileUploader = ({ onClose, onUpload }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dataType, setDataType] = useState('PHR');
    
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    const handleDataTypeChange = (event) => setDataType(event.target.value);

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
            // const generatedKey = CryptoJS.lib.WordArray.random(32).toString();
            // setSymmetricKey(generatedKey);

            // const encryptedFile = await encryptFile(selectedFile, generatedKey);
            // const hashIndex = CryptoJS.SHA256(selectedFile.name).toString();

            // const metadata = {
            //     publicKey: userPublicKey,
            //     dataType,
            //     hashIndex,
            // };
            // const reader = new FileReader();
            // const fileContent = await new Promise((resolve) => {
            //     reader.onloadend = () => resolve(reader.result);
            //     reader.readAsDataURL(encryptedFile);
            // });

            // const toUploadFile = new File(
            //     [JSON.stringify({ metadata, content: fileContent })],
            //     encryptedFile.name,
            //     { type: 'application/json' }
            // );
            const uploadedData = await uploadToIPFS(selectedFile);
            setIpfsHash(uploadedData.cid);

            // Prepare transaction data for signing
            const transactionData = JSON.stringify({
                publicKey: userPublicKey,
                dataType: dataType,
                ipfsHash: uploadedData.cid
            });

            // Sign the transaction data with the user's Ethereum private key
            const signature = await signer.signMessage(transactionData);

            // Interact with blockchain and add the record
            const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
            const dataTypeEnum = getDataTypeEnum(dataType);
            // Call addPHRData function from the smart contract
            const tx = await contract.addPHRData(uploadedData.cid, dataTypeEnum, {
                gasLimit: 500000 // Adjust gas limit if necessary
            });
            await tx.wait();  // Wait for the transaction to be mined
            // After successful blockchain interaction, call the onUpload callback
            onUpload({ ipfsHash: uploadedData.cid, dataType, owner: userPublicKey, signature });
            
            // Call the download and decrypt function immediately after upload
            
            console.log('File uploaded successfully.');
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file. Please try again.');
        } finally {
            setLoading(false);
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
                <TextField type="file" onChange={handleFileChange} fullWidth />
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
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleFileUpload} variant="contained" color="primary" disabled={!selectedFile || loading}>
                    {loading ? 'Uploading...' : 'Upload & Download'}
                </Button>
            </DialogActions>
        </>
    );
};

export default FileUploader;
