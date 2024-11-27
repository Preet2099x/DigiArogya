export async function getMetaMaskPublicKeyAsBase64() {
    try {
        // Ensure MetaMask is available
        if (!window.ethereum) {
            throw new Error("MetaMask is not installed!");
        }

        // Request the user's Ethereum account
        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
        });
        const userAddress = accounts[0]; // Assume the first account is used
        console.log("User's Ethereum Address:", userAddress);

        // Get the MetaMask encryption public key
        const publicKeyHex = await window.ethereum.request({
            method: "eth_getEncryptionPublicKey",
            params: [userAddress],
        });

        console.log("MetaMask Public Key (Hex):", publicKeyHex);

        // Convert the public key from hex to Uint8Array
        const publicKeyBytes = Uint8Array.from(
            publicKeyHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
        );

        // Convert the Uint8Array to a Base64 string
        const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyBytes));

        console.log("MetaMask Public Key (Base64):", publicKeyBase64);

        return publicKeyBase64;
    } catch (error) {
        console.error("Failed to get MetaMask public key:", error);
        throw error;
    }
}
