export function generateSymmetricKey() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return array;
}