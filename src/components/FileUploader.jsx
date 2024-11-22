import React, { useState } from 'react';
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
} from '@mui/material';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { BrowserProvider } from 'ethers';

const FileUploader = ({ onClose, onUpload }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ipfsHash, setIpfsHash] = useState('');
    const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
    const pinataApiSecret = process.env.REACT_APP_PINATA_API_SECRET;

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
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

            const symmetricKey = CryptoJS.lib.WordArray.random(32).toString();
            const fileData = await selectedFile.text();
            const encryptedData = CryptoJS.AES.encrypt(fileData, symmetricKey).toString();

            const hashIndex = CryptoJS.SHA256(encryptedData).toString();

            const metadata = JSON.stringify({
                publicKey: userPublicKey,
                dataType: 'PHR',
                hashIndex,
                encryptedData,
            });

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

            const transactionData = JSON.stringify({
                publicKey: userPublicKey,
                dataType: 'PHR',
                hashIndex,
            });

            const signature = await signer.signMessage(transactionData);

            const newRecord = {
                dataHash: ipfsHash,
                dataType: 'PHR',
                timestamp: new Date().toISOString().split('T')[0],
                provider: 'Self',
                isValid: true,
                signature,
            };

            onUpload(newRecord);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file. Please try again.');
        } finally {
            setLoading(false);
            onClose();
        }
    };

    return (
        <>
            <DialogTitle>Upload Personal Health Record</DialogTitle>
            <DialogContent>
                <TextField
                    type="file"
                    onChange={handleFileChange}
                    fullWidth
                />
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
