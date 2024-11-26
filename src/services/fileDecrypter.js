import CryptoJS from "crypto-js";

const decryptBase64ToFile = (base64Content, secretKey) => {
    try {
        const combinedData = CryptoJS.enc.Base64.parse(base64Content);
        const key = CryptoJS.enc.Utf8.parse(secretKey);

        const iv = CryptoJS.lib.WordArray.create(combinedData.words.slice(0, 4), 16);
        const ciphertext = CryptoJS.lib.WordArray.create(combinedData.words.slice(4), combinedData.sigBytes - 16);

        const decrypted = CryptoJS.AES.decrypt({ ciphertext }, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        const decryptedArrayBuffer = new Uint8Array(decrypted.sigBytes);
        for (let i = 0; i < decrypted.sigBytes; i++) {
            decryptedArrayBuffer[i] = (decrypted.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        }

        return new Blob([decryptedArrayBuffer], { type: 'application/octet-stream' });
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt the file. Please check your decryption key and encrypted content.');
    }
};

export default decryptBase64ToFile;
