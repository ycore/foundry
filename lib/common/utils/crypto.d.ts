/**
 * Generates a random 32-bit unsigned integer.
 * @returns {Promise<number>} A promise that resolves to a random 32-bit unsigned integer.
 */
export declare const random32: () => Promise<number>;
/**
 * Generates a random 64-character base64url encoded string.
 * @returns {string} A random 64-character base64url encoded string.
 */
export declare const random64: () => string;
/**
 * Converts a secret string into a JWE key using SHA-256 hashing.
 * @param {string} secret - The secret string to be hashed.
 * @returns {Promise<Uint8Array>} A promise that resolves to a Uint8Array representing the JWE key.
 */
export declare const toJweKey: (secret: string) => Promise<Uint8Array>;
/**
 * Shuffles an array of strings using a Fisher-Yates algorithm.
 * @param {string[]} arr - The array of strings to shuffle.
 * @returns {string[]} A new array containing the shuffled strings.
 */
export declare const shuffle: (arr: string[]) => string[];
/**
 * Generates a random salt of specified length.
 * @param {number} [length=16] - The length of the salt to generate. Defaults to 16.
 * @returns {Promise<string>} A promise that resolves to a hexadecimal string representing the random salt.
 */
export declare function generateRandomSalt(length?: number): Promise<string>;
/**
 * Compares two strings in a timing-safe manner to prevent timing attacks.
 * @param {string} a - The first string to compare.
 * @param {string} b - The second string to compare.
 * @returns {boolean} True if the strings are equal, false otherwise.
 */
export declare function timingSafeCompare(a: string, b: string): boolean;
/**
 * Converts a buffer of numbers to a hexadecimal string.
 * @param {number[]} valueBuffer - An array of numbers representing the byte values.
 * @returns {string} A hexadecimal string representation of the input buffer.
 */
export declare const toHex: (valueBuffer: number[]) => string;
/**
 * Encodes data into a base64url string.
 * @param {Uint8Array | string} data - The data to encode. Can be either a Uint8Array or a string.
 * @returns {string} The base64url encoded string.
 */
export declare const base64Encode: (data: Uint8Array | string) => string;
/**
 * Decodes a base64url string into a decoded string.
 * @param {Uint8Array | string} data - The base64url encoded data to decode.
 * @returns {string} The decoded string.
 */
export declare const base64Decode: (data: Uint8Array | string) => string;
//# sourceMappingURL=crypto.d.ts.map