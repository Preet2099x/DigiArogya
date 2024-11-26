import { BrowserProvider } from "ethers";

export async function encryptSymmetricKey(symmetricKey) {
    if (!window.ethereum) {
        alert("MetaMask is required!");
        return null;
    }

    try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const userAddress = await signer.getAddress();
        console.log("User's Ethereum Address:", userAddress);

        const publicKey = await window.ethereum.request({
            method: "eth_getEncryptionPublicKey",
            params: [userAddress],
        });

        console.log("User's Public Key:", publicKey);

        const encryptedKey = await encryptWithPublicKey(publicKey, symmetricKey);
        console.log("Encrypted Key:", encryptedKey);
        return encryptedKey;
    } catch (error) {
        console.error("Encryption failed:", error);
        return null;
    }
}

export async function encryptWithPublicKey(publicKey, data) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const publicKeyBuffer = Uint8Array.from(atob(publicKey), (c) => c.charCodeAt(0));

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

    return Buffer.from(encryptedData).toString("base64");
}
