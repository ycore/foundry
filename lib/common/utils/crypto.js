import { base64url } from 'jose';
/**
 * Generates a random 32-bit unsigned integer.
 * @returns {Promise<number>} A promise that resolves to a random 32-bit unsigned integer.
 */
export const random32 = async () => {
    return new Uint32Array(crypto.getRandomValues(new Uint8Array(4)).buffer)[0];
};
/**
 * Generates a random 64-character base64url encoded string.
 * @returns {string} A random 64-character base64url encoded string.
 */
export const random64 = () => {
    return base64url.encode(crypto.getRandomValues(new Uint8Array(20)));
};
/**
 * Converts a secret string into a JWE key using SHA-256 hashing.
 * @param {string} secret - The secret string to be hashed.
 * @returns {Promise<Uint8Array>} A promise that resolves to a Uint8Array representing the JWE key.
 */
export const toJweKey = async (secret) => {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
    return new Uint8Array(hash);
};
/**
 * Shuffles an array of strings using a Fisher-Yates algorithm.
 * @param {string[]} arr - The array of strings to shuffle.
 * @returns {string[]} A new array containing the shuffled strings.
 */
export const shuffle = (arr) => {
    return arr
        .map((a) => [Math.random(), a])
        .sort((a, b) => a[0] - b[0])
        .map(a => a[1]);
};
/**
 * Generates a random salt of specified length.
 * @param {number} [length=16] - The length of the salt to generate. Defaults to 16.
 * @returns {Promise<string>} A promise that resolves to a hexadecimal string representing the random salt.
 */
export async function generateRandomSalt(length = 16) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    return toHex(Array.from(randomBytes));
}
/**
 * Compares two strings in a timing-safe manner to prevent timing attacks.
 * @param {string} a - The first string to compare.
 * @param {string} b - The second string to compare.
 * @returns {boolean} True if the strings are equal, false otherwise.
 */
export function timingSafeCompare(a, b) {
    if (a.length !== b.length)
        return false;
    // constant-time compare each character
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}
/**
 * Converts a buffer of numbers to a hexadecimal string.
 * @param {number[]} valueBuffer - An array of numbers representing the byte values.
 * @returns {string} A hexadecimal string representation of the input buffer.
 */
export const toHex = (valueBuffer) => valueBuffer.map(byte => byte.toString(16).padStart(2, '0')).join('');
/**
 * Encodes data into a base64url string.
 * @param {Uint8Array | string} data - The data to encode. Can be either a Uint8Array or a string.
 * @returns {string} The base64url encoded string.
 */
export const base64Encode = (data) => base64url.encode(data);
/**
 * Decodes a base64url string into a decoded string.
 * @param {Uint8Array | string} data - The base64url encoded data to decode.
 * @returns {string} The decoded string.
 */
export const base64Decode = (data) => {
    const decoder = new TextDecoder();
    return decoder.decode(base64url.decode(data));
};
//# sourceMappingURL=crypto.js.map