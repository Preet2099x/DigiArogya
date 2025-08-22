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
        
        if (data.data && typeof data.data === 'object') {
            // Case 1: Standard format with data.data object
            if (data.data.encryptedContent) {
                encryptedContent = data.data.encryptedContent;
                fileName = data.data.fileName || 'file';
                fileType = data.data.fileType || 'unknown';
                dataType = data.data.dataType;
            } 
            // Case 2: JSON string that needs parsing
            else if (typeof data === 'string') {
                try {
                    const parsedData = JSON.parse(data);
                    encryptedContent = parsedData.encryptedContent;
                    fileName = parsedData.fileName || 'file';
                    fileType = parsedData.fileType || 'unknown';
                    dataType = parsedData.dataType;
                } catch (e) {
                    console.error("Failed to parse JSON response:", e);
                }
            }
        }
        
        // Case 3: Direct response format
        if (!encryptedContent && data && typeof data === 'object') {
            encryptedContent = data.encryptedContent;
            fileName = data.fileName || 'file';
            fileType = data.fileType || 'unknown';
            dataType = data.dataType;
        }

        if (!encryptedContent) {
            throw new Error('Invalid response format. Missing encryptedContent.');
        }

        return { encryptedContent, fileType, fileName, dataType };
    } catch (error) {
        console.error('IPFS download error:', error);
        throw new Error(`Failed to fetch file from IPFS: ${error.message}`);
    }
};