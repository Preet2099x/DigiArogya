import CryptoJS from "crypto-js";

const encryptFileToBase64 = async (file, secretKey) => {
    try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
        const key = CryptoJS.enc.Utf8.parse(secretKey);
        const iv = CryptoJS.lib.WordArray.random(16);

        const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        const combinedData = iv.concat(encrypted.ciphertext).toString(CryptoJS.enc.Base64);

        return combinedData;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt the file.');
    }
};

const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new DOMException("Problem parsing input file."));
        reader.readAsArrayBuffer(file);
    });
};

export default encryptFileToBase64;
