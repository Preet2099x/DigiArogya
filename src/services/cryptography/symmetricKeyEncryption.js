/* global BigInt */
'use strict';

/** 
 * @param {Array} publicKey
 * @param {string|number} symmetricKey 
 * @returns {BigInt} 
 */
export function rsaEncrypt(publicKey, symmetricKey) {
    const [e, n] = publicKey.map(BigInt);

    const m = typeof symmetricKey === "string"
        ? BigInt([...symmetricKey].map(char => char.charCodeAt(0)).join(""))
        : BigInt(symmetricKey);

    const c = m ** e % n;
    return c;
}

/**
 * 
 * @param {Array} privateKey 
 * @param {BigInt} encryptedSymmetricKey 
 * @returns {string|BigInt}
 */
export function rsaDecrypt(privateKey, encryptedSymmetricKey) {
    const [d, n] = privateKey.map(BigInt);

    const m = encryptedSymmetricKey ** d % n;

    const mStr = m.toString();
    try {
        const symmetricKey = mStr.match(/.{1,3}/g)
            .map(code => String.fromCharCode(parseInt(code, 10)))
            .join("");
        return symmetricKey;
    } catch (err) {
        return m;
    }
}
