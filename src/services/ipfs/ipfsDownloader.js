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
        console.log('IPFS raw response:', data);

        // Try to extract encryptedContent from different possible locations
        let encryptedContent, fileName, fileType, dataType;
        if (data.data && data.data.encryptedContent) {
            encryptedContent = data.data.encryptedContent;
            fileName = data.data.fileName;
            fileType = data.data.fileType;
            dataType = data.data.dataType;
            return { encryptedContent, fileType, fileName, dataType };
        } else if (data.encryptedContent) {
            encryptedContent = data.encryptedContent;
            fileName = data.fileName;
            fileType = data.fileType;
            dataType = data.dataType;
            return { encryptedContent, fileType, fileName, dataType };
        } else if (data.contentType && data.contentType.startsWith('image/')) {
            // Raw image or file, just return the blob
            return { rawContent: data.data, fileType: data.contentType, fileName: ipfsHash, dataType: 'raw' };
        } else {
            throw new Error('Invalid response format. Missing encryptedContent. Full response: ' + JSON.stringify(data));
        }
    } catch (error) {
        console.error('IPFS download error:', error);
        throw new Error(`Failed to fetch file from IPFS: ${error.message}`);
    }
};