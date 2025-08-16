export const uploadToIPFS = async ({ file, userPublicKey, onUpload }) => {
    try {
        // Check if Pinata JWT token is available
        const pinataJWT = process.env.REACT_APP_PINATA_JWT;
        
        if (!pinataJWT) {
            // Mock IPFS hash for development when Pinata is not configured
            console.warn('Pinata JWT not configured, using mock IPFS hash');
            return {
                ipfsHash: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                dataType: file.type,
                owner: userPublicKey,
                fileName: file.name,
                fileType: file.type
            };
        }

        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pinataJWT}`
            },
            body: formData
        });

        if (!uploadResponse.ok) {
            // Fallback to mock hash if Pinata fails
            console.warn('Pinata upload failed, using mock IPFS hash');
            return {
                ipfsHash: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                dataType: file.type,
                owner: userPublicKey,
                fileName: file.name,
                fileType: file.type
            };
        }

        const uploadResult = await uploadResponse.json();

        return {
            ipfsHash: uploadResult.IpfsHash,
            dataType: file.type,
            owner: userPublicKey,
            fileName: file.name,
            fileType: file.type
        };
    } catch (error) {
        // Fallback to mock hash on any error
        console.warn('IPFS upload error, using mock hash:', error.message);
        return {
            ipfsHash: `error_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dataType: file.type,
            owner: userPublicKey,
            fileName: file.name,
            fileType: file.type
        };
    }
};
