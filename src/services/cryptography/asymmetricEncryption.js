export async function encryptSymmetricKey(symmetricKey, publicKeyForEncryption) {
    if (!window.ethereum) {
        alert("MetaMask is required!");
        return null;
    }

    try {

        console.log("User's Public Key (Base64):", publicKeyForEncryption);

        const encryptedKey = await encryptWithPublicKey(publicKeyForEncryption, symmetricKey);
        console.log("Encrypted Key:", encryptedKey);

        return encryptedKey;
    } catch (error) {
        console.error("Encryption failed:", error);
        return null;
    }
}

export async function encryptWithPublicKey(publicKeyBase64, symmetricKey) {
    const encoder = new TextEncoder();
    const encodedSymmetricKey = encoder.encode(symmetricKey);
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

    const encryptedSymmetricKey = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        cryptoKey,
        encodedSymmetricKey
    );

    return btoa(String.fromCharCode(...new Uint8Array(encryptedSymmetricKey)));
}
export async function decryptWithPrivateKey(privateKeyBase64, encryptedSymmetricKey) {
    try {
        const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0));

        const cryptoKey = await window.crypto.subtle.importKey(
            "pkcs8",
            privateKeyBuffer,
            {
                name: "RSA-OAEP",
                hash: {
                    name: "SHA-256"
                }
            },
            false,
            ["decrypt"]
        );

        const encryptedBuffer = Uint8Array.from(atob(encryptedSymmetricKey), (c) => c.charCodeAt(0));

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP",
                hash: {
                    name: "SHA-256"
                }
            },
            cryptoKey,
            encryptedBuffer
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        console.error("Decryption failed:", error);

        if (error instanceof DOMException) {
            console.error("DOM Exception Details:", {
                name: error.name,
                message: error.message,
                code: error.code
            });
        }

        return null;
    }
}