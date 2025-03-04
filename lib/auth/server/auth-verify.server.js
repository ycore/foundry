import { generateTOTP, verifyTOTP } from '@oslojs/otp';
import { contextEnv, isDev } from '../../common/services/env.js';
import { base64Encode, random64, toJweKey } from '../../common/utils/crypto.js';
import { jose } from '../../vendor/crypto.js';
import { resolveAuthConfig } from '../config/resolve-config.js';
import { AUTH_ERRORS, AuthError } from '../utils/error-auth.js';
const KVVerifyTemplate = (email) => `totp:${email}`;
export const assignConfig = async (context, config) => {
    const authConfig = await resolveAuthConfig();
    const options = {
        secret: config?.secret ?? contextEnv(context).TOTP_SECRET_KEY,
        kv: config?.kv ?? contextEnv(context).ADMIN_KV,
        digits: config?.digits ?? authConfig.totp.digits,
        period: config?.period ?? authConfig.totp.period,
        maxAttempts: config?.maxAttempts ?? authConfig.totp.maxAttempts,
    };
    if (!options?.secret || !options?.kv) {
        throw new Error(AUTH_ERRORS.TOTP_SECRET);
    }
    return options;
};
export const authTOTP = {
    create: async (email, context, options) => {
        const config = await assignConfig(context, options);
        const randomKey = random64();
        const jweKey = await toJweKey(randomKey);
        const code = generateTOTP(jweKey, config.period, config.digits);
        // Create and encrypt TOTP data
        const totpData = { secret: randomKey, expireAt: Date.now() + config.period * 1000 };
        const jwe = await jwEncrypt(totpData, config.secret);
        const verificationData = { jwe, attempts: 0 };
        await config.kv.put(KVVerifyTemplate(email), JSON.stringify(verificationData), { expirationTtl: config.period });
        if (isDev(context)) {
            console.info(`[DEV] Verification TOTP Code for ${email}: ${code}`);
        }
        return code;
    },
    verify: async (email, code, context, options) => {
        const config = await assignConfig(context, options);
        const kvKey = KVVerifyTemplate(email);
        const storedData = await config.kv.get(kvKey);
        if (!storedData) {
            return [new AuthError({ kind: 'TOTP EXPIRED', message: AUTH_ERRORS.TOTP_EXPIRED }), undefined];
        }
        const verification = JSON.parse(storedData);
        if (verification.attempts >= config.maxAttempts) {
            await config.kv.delete(kvKey);
            return [new AuthError({ kind: 'TOTP ATTEMPTS', message: AUTH_ERRORS.TOTP_ATTEMPTS }), undefined];
        }
        const totpData = await jwDecrypt(verification.jwe, config.secret);
        if (Date.now() > totpData.expireAt) {
            await config.kv.delete(kvKey);
            return [new AuthError({ kind: 'TOTP EXPIRED', message: AUTH_ERRORS.TOTP_EXPIRED }), undefined];
        }
        const key = await toJweKey(totpData.secret);
        const isValidCode = verifyTOTP(key, config.period, config.digits, code);
        if (!isValidCode) {
            await config.kv.put(kvKey, JSON.stringify({ ...verification, attempts: verification.attempts + 1 }), { expirationTtl: config.period });
            return [new AuthError({ kind: 'TOTP INVALID', message: AUTH_ERRORS.TOTP_INVALID }), undefined];
        }
        await config.kv.delete(kvKey);
        return [null, true];
    },
    link: async (linkPath, linkRef, context, request) => {
        const url = new URL(linkPath ?? '/', new URL(request.url).origin);
        const token = base64Encode(JSON.stringify(linkRef));
        url.pathname = [url.pathname.replace(/\/$/, ''), token].join('/');
        if (isDev(context)) {
            console.info(`[DEV] verify link: ${url.toString()}`);
        }
        return url.toString();
    },
};
const jwEncrypt = async (data, secret) => {
    const key = await toJweKey(secret);
    return await new jose.CompactEncrypt(new TextEncoder().encode(JSON.stringify(data))).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).encrypt(key);
};
const jwDecrypt = async (jwe, secret) => {
    const key = await toJweKey(secret);
    const { plaintext } = await jose.compactDecrypt(jwe, key);
    return JSON.parse(new TextDecoder().decode(plaintext));
};
//# sourceMappingURL=auth-verify.server.js.map