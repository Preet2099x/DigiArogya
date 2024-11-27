import { generateAndExportKeys } from "./keyPairGenerator";

export async function encryptSymmetricKey(symmetricKey) {
    if (!window.ethereum) {
        alert("MetaMask is required!");
        return null;
    }

    const keyPair = await generateAndExportKeys();
    try {
        const publicKeyBuffer = await window.crypto.subtle.exportKey(
            "spki",
            keyPair.publicKey
        );

        const publicKeyBase64 = btoa(
            String.fromCharCode(...new Uint8Array(publicKeyBuffer))
        );

        console.log("User's Public Key (Base64):", publicKeyBase64);

        const encryptedKey = await encryptWithPublicKey(publicKeyBase64, symmetricKey);
        console.log("Encrypted Key:", encryptedKey);
        return encryptedKey;
    } catch (error) {
        console.error("Encryption failed:", error);
        return null;
    }
}

export async function encryptWithPublicKey(publicKeyBase64, data) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), (c) => c.charCodeAt(0));

    const cryptoKey = await window.crypto.subtle.importKey(
        "spki",
        publicKeyBuffer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        false,
        ["encrypt"]
    );

    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        cryptoKey,
        encodedData
    );

    return btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
}
export async function decryptWithPrivateKey(privateKeyBase64, encryptedData) {
    const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0));

    const cryptoKey = await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        false,
        ["decrypt"]
    );

    const encryptedBuffer = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    const decryptedData = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        cryptoKey,
        encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
}