import { PinataSDK } from "pinata-web3";
const pinata = new PinataSDK({
    pinataJwt: process.env.REACT_APP_PINATA_JWT,
    pinataGateway: process.env.REACT_APP_PINATA_GATEWAY,
});

export const downloadFromIPFS = async (ipfsHash) => {
    try {
        if (!ipfsHash || typeof ipfsHash !== 'string') {
            throw new Error('Invalid IPFS hash: hash must be a non-empty string');
        }

        const data = await pinata.gateways.get(ipfsHash);
        console.log("IPFS Response:", data);

        // Handle different response formats
        let encryptedContent, fileName, fileType, dataType;
        
        // Case 1: Standard format with data.data object
        if (data && data.data) {
            if (typeof data.data === 'object' && data.data.encryptedContent) {
                encryptedContent = data.data.encryptedContent;
                fileName = data.data.fileName || 'file';
                fileType = data.data.fileType || 'unknown';
                dataType = data.data.dataType;
            } 
            // Handle case where data.data is a string that needs parsing
            else if (typeof data.data === 'string') {
                try {
                    const parsedData = JSON.parse(data.data);
                    if (parsedData && parsedData.encryptedContent) {
                        encryptedContent = parsedData.encryptedContent;
                        fileName = parsedData.fileName || 'file';
                        fileType = parsedData.fileType || 'unknown';
                        dataType = parsedData.dataType;
                    }
                } catch (e) {
                    console.error("Failed to parse JSON response:", e);
                }
            }
        }
        
        // Case 2: Direct response format where data itself contains the content
        if (!encryptedContent && data) {
            if (typeof data === 'object' && data.encryptedContent) {
                encryptedContent = data.encryptedContent;
                fileName = data.fileName || 'file';
                fileType = data.fileType || 'unknown';
                dataType = data.dataType;
            }
            // Handle case where data is a string that needs parsing
            else if (typeof data === 'string') {
                try {
                    const parsedData = JSON.parse(data);
                    if (parsedData && parsedData.encryptedContent) {
                        encryptedContent = parsedData.encryptedContent;
                        fileName = parsedData.fileName || 'file';
                        fileType = parsedData.fileType || 'unknown';
                        dataType = parsedData.dataType;
                    }
                } catch (e) {
                    console.error("Failed to parse JSON string response:", e);
                }
            }
        }
        
        // Case 3: Handle raw binary data response
        if (!encryptedContent && data) {
            try {
                // If we have raw data but no structured content, try to use it directly
                if (typeof data === 'string' && data.length > 0) {
                    encryptedContent = data;
                    fileName = 'file';
                    fileType = 'unknown';
                } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
                    // Convert binary data to base64 string
                    const bytes = new Uint8Array(data);
                    let binary = '';
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    encryptedContent = btoa(binary);
                    fileName = 'file';
                    fileType = 'unknown';
                }
            } catch (e) {
                console.error("Failed to process raw data:", e);
            }
        }

        if (!encryptedContent) {
            console.error("Response data structure:", JSON.stringify(data, null, 2));
            throw new Error('Invalid response format. Missing encryptedContent.');
        }

        return { encryptedContent, fileType, fileName, dataType };
    } catch (error) {
        console.error('IPFS download error:', error);
        throw new Error(`Failed to fetch file from IPFS: ${error.message}`);
    }
};