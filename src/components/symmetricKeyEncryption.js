/**
 * Encrypts a plaintext message using the RSA public key.
 * 
 * @param {Array} publicKey - Array [e, n] where e is the public exponent and n is the modulus.
 * @param {string|number} plaintext - The message to encrypt (string or number).
 * @returns {BigInt} - The encrypted ciphertext.
 */
function rsaEncrypt(publicKey, plaintext) {
    const [e, n] = publicKey.map(BigInt);
    
    // Convert plaintext to a numeric representation if it's a string
    const m = typeof plaintext === "string" 
        ? BigInt([...plaintext].map(char => char.charCodeAt(0)).join("")) 
        : BigInt(plaintext);
    
    // Encrypt using m^e % n
    const c = m ** e % n;
    return c;
}

/**
 * Decrypts a ciphertext message using the RSA private key.
 * 
 * @param {Array} privateKey - Array [d, n] where d is the private exponent and n is the modulus.
 * @param {BigInt} ciphertext - The encrypted message (BigInt).
 * @returns {string|BigInt} - The decrypted plaintext as a string or number.
 */
function rsaDecrypt(privateKey, ciphertext) {
    const [d, n] = privateKey.map(BigInt);
    
    // Decrypt using c^d % n
    const m = ciphertext ** d % n;
    
    // Attempt to convert numeric message back to a string
    const mStr = m.toString();
    try {
        const plaintext = mStr.match(/.{1,3}/g) // Split into chunks of 3 digits
            .map(code => String.fromCharCode(parseInt(code, 10)))
            .join("");
        return plaintext;
    } catch (err) {
        // Return numeric message if decoding fails
        return m;
    }
}

// // Example Usage
// const publicKey = [17, 3233];    // e = 17, n = 3233
// const privateKey = [2753, 3233]; // d = 2753, n = 3233

// const message = "HELLO";

// // Encrypt the message
// const ciphertext = rsaEncrypt(publicKey, message);
// console.log("Encrypted Message:", ciphertext.toString());

// // Decrypt the ciphertext
// const decryptedMessage = rsaDecrypt(privateKey, ciphertext);
// console.log("Decrypted Message:", decryptedMessage);
