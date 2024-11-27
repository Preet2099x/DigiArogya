import { getMetaMaskPublicKeyAsBase64 } from "./generatePublicKey";
import { generateAndExportKeys } from "./keyPairGenerator";

export async function encryptSymmetricKey(symmetricKey) {
    if (!window.ethereum) {
        alert("MetaMask is required!");
        return null;
    }

    const keyPair = await getMetaMaskPublicKeyAsBase64();

    try {
        // Export the public key to spki format
        const publicKeyBuffer = await window.crypto.subtle.exportKey(
            "spki",
            keyPair.publicKey
        );

        // Encode the public key to Base64
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

    // Decode the Base64-encoded public key
    const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), (c) => c.charCodeAt(0));

    // Import the public key into a CryptoKey
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

    // Encrypt the data with the public key
    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        cryptoKey,
        encodedData
    );

    // Return the encrypted data as Base64
    return btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
}
