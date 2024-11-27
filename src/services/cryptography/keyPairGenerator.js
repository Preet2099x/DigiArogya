export async function generateAndExportKeys() {
    try {
        // Generate the RSA key pair
        const keyPair = await crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: { name: "SHA-256" },
            },
            true, // Allow key export
            ["encrypt", "decrypt"]
        );

        // Return the keyPair directly
        return keyPair;
    } catch (err) {
        console.error("Error generating keys:", err);
    }
}
