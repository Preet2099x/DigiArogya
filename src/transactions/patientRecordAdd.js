import { ethers } from "ethers";
import { getDataTypeEnum } from "../services/getDataType";

async function addPatientRecord(userPublicKey, dataType, uploadedData, signer, contractAddress, contractABI, onUpload) {
    const transactionData = JSON.stringify({
        publicKey: userPublicKey,
        dataType: dataType,
        ipfsHash: uploadedData.ipfsHash
    });

    const signature = await signer.signMessage(transactionData);
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    const dataTypeEnum = getDataTypeEnum(dataType);
    const tx = await contract.addPHRData(uploadedData.ipfsHash, dataTypeEnum, {
        gasLimit: 500000
    });
    await tx.wait();
    onUpload({ ...uploadedData, dataType, publicKey: userPublicKey, signature });
    return { success: true, hash: tx.hash };
}

export default addPatientRecord;