export async function generateAndExportKeys() {
    try {
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

        return keyPair;
    } catch (err) {
        console.error("Error generating keys:", err);
    }
}
