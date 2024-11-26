export const uploadToIPFS = async ({ file, userPublicKey, onUpload }) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT}`
            },
            body: formData
        });

        if (!uploadResponse.ok) {
            throw new Error('Failed to upload to Pinata');
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
        throw new Error(`IPFS upload failed: ${error.message}`);
    }
};
