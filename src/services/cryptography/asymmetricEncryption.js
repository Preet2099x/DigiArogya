export async function encryptSymmetricKey(symmetricKey, publicKeyForEncryption) {
    if (!window.ethereum) {
        alert("MetaMask is required!");
        return null;
    }

    try {
        // const publicKeyBuffer = await window.crypto.subtle.exportKey(
        //     "spki",
        //     publicKeyForEncryption
        // );

        // const publicKeyBase64 = btoa(
        //     String.fromCharCode(...new Uint8Array(publicKeyBuffer))
        // );

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

    const encryptedBuffer = Uint8Array.from(atob(encryptedSymmetricKey), (c) => c.charCodeAt(0));

    const decryptedSymmetricKey = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        cryptoKey,
        encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedSymmetricKey);
}