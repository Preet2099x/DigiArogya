export async function generateAndExportKeys() {
    try {
        const keyPair = await crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: { name: "SHA-256" },
            },
            true,
            ["encrypt", "decrypt"]
        );

        const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
        const publicKeyBase64 = btoa(
            String.fromCharCode.apply(null, new Uint8Array(publicKeyBuffer))
        );

        const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        const privateKeyBase64 = btoa(
            String.fromCharCode.apply(null, new Uint8Array(privateKeyBuffer))
        );

        return {
            publicKeyBase64,
            privateKeyBase64,
            keyPair
        };
    } catch (err) {
        console.error("Error generating keys:", err);
        return null;
    }
}