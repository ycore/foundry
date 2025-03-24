import { generateRandomSalt, timingSafeCompare, toHex } from '../../common/utils/crypto.js';
const HASH_DEFAULTS = {
    BIT_LENGTH: 256,
    BYTES_LENGTH: 16,
    HASH_ALGORITHM: 'PBKDF2',
    HASH_FUNCTION: 'SHA-256',
    ITERATIONS: 100000,
    PREFIX_POS: 24,
    SUFFIX_POS: -8,
};
export async function hashPassword(password) {
    const salt = await generateRandomSalt(HASH_DEFAULTS.BYTES_LENGTH);
    const hashedHex = await generateHash(salt, password);
    return salt.slice(0, HASH_DEFAULTS.PREFIX_POS) + hashedHex + salt.slice(HASH_DEFAULTS.SUFFIX_POS);
}
export async function comparePassword(password, hashedPassword) {
    const salt = hashedPassword.slice(0, HASH_DEFAULTS.PREFIX_POS) + hashedPassword.slice(HASH_DEFAULTS.SUFFIX_POS);
    const originalHash = hashedPassword.slice(HASH_DEFAULTS.PREFIX_POS, HASH_DEFAULTS.SUFFIX_POS);
    const hashedHex = await generateHash(salt, password);
    return timingSafeCompare(originalHash, hashedHex);
}
async function generateHash(salt, password) {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), HASH_DEFAULTS.HASH_ALGORITHM, false, ['deriveBits', 'deriveKey']);
    const derivedBits = await crypto.subtle.deriveBits({ name: HASH_DEFAULTS.HASH_ALGORITHM, hash: HASH_DEFAULTS.HASH_FUNCTION, salt: encoder.encode(salt), iterations: HASH_DEFAULTS.ITERATIONS }, baseKey, HASH_DEFAULTS.BIT_LENGTH);
    const hashedHex = toHex(Array.from(new Uint8Array(derivedBits)));
    return hashedHex;
}
//# sourceMappingURL=auth-hash.js.map