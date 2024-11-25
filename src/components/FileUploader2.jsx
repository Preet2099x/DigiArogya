import {
    Button,
    CircularProgress,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    TextField
} from '@mui/material';
import CryptoJS from 'crypto-js';
import { BrowserProvider } from 'ethers';
import React, { useState } from 'react';
import encryptFileToBase64 from '../services/fileEncrypter';
import { uploadToIPFS } from '../services/ipfsUploader';

const FileUploader = ({ onClose, onUpload }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dataType, setDataType] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setError('');
    };

    const handleDataTypeChange = (event) => setDataType(event.target.value);

    const handleFileUpload = async () => {
        if (!selectedFile || !dataType) {
            setError('Please select both a file and data type.');
            return;
        }

        setLoading(true);
        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userPublicKey = await signer.getAddress();

            const generatedKey = CryptoJS.lib.WordArray.random(32).toString();
            console.log('Generated key:', generatedKey);
            const base64Content = await encryptFileToBase64(selectedFile, generatedKey);

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