import { getContext } from '@ycore/forge/context';
import { logger } from '@ycore/forge/logger';
import { err, ok, type Result } from '@ycore/forge/result';
import { getBindings } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';

import { authConfigContext } from './auth.context';

export type VerificationPurpose = 'signup' | 'passkey-add' | 'passkey-delete' | 'email-change' | 'account-delete' | 'recovery';

interface TOTPOptions {
  secret: string | Uint8Array;
  timestamp?: number;
  period?: number;
  digits?: number;
  algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-512';
}

interface VerifyTOTPOptions extends TOTPOptions {
  token: string;
  window?: number;
}

interface StoredVerification {
  secret: string;
  expireAt: number;
  attempts: number;
  purpose: VerificationPurpose;
  metadata?: Record<string, unknown>;
}

function base32Decode(input: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanInput = input.replace(/[^A-Z2-7]/gi, '').toUpperCase();

  let bits = '';
  for (const char of cleanInput) {
    const value = alphabet.indexOf(char);
    if (value === -1) throw new Error(`Invalid base32 character: ${char}`);
    bits += value.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }

  return bytes;
}

function normalizeSecret(secret: string | Uint8Array): Uint8Array {
  if (secret instanceof Uint8Array) return secret;

  try {
    return base32Decode(secret);
  } catch {
    return new TextEncoder().encode(secret);
  }
}

function uint64ToBytes(num: number): Uint8Array {
  const bytes = new Uint8Array(8);
  const high = Math.floor(num / 0x100000000);
  const low = num & 0xffffffff;

  bytes[0] = (high >>> 24) & 0xff;
  bytes[1] = (high >>> 16) & 0xff;
  bytes[2] = (high >>> 8) & 0xff;
  bytes[3] = high & 0xff;
  bytes[4] = (low >>> 24) & 0xff;
  bytes[5] = (low >>> 16) & 0xff;
  bytes[6] = (low >>> 8) & 0xff;
  bytes[7] = low & 0xff;

  return bytes;
}

async function hmac(algorithm: string, key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  // Convert to ArrayBuffer for Web Crypto API
  const keyBuffer = new ArrayBuffer(key.length);
  new Uint8Array(keyBuffer).set(key);

  const dataBuffer = new ArrayBuffer(data.length);
  new Uint8Array(dataBuffer).set(data);

  const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, { name: 'HMAC', hash: algorithm }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  return new Uint8Array(signature);
}

function dynamicTruncation(hash: Uint8Array, digits: number): string {
  const offset = hash[hash.length - 1] & 0x0f;
  const code = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);

  return (code % 10 ** digits).toString().padStart(digits, '0');
}

export function generateSecret(length = 32): Uint8Array {
  if (length <= 0) throw new Error('Length must be positive');
  return crypto.getRandomValues(new Uint8Array(length));
}

export function base32Encode(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, '0');
  }

  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    result += alphabet[Number.parseInt(chunk, 2)];
  }

  return result;
}

export async function generateTOTP(options: TOTPOptions): Promise<string> {
  const { secret, timestamp = Date.now(), period = 30, digits = 6, algorithm = 'SHA-1' } = options;

  if (period <= 0) throw new Error('Period must be positive');

  const counter = Math.floor(timestamp / 1000 / period);
  const secretBytes = normalizeSecret(secret);
  const counterBytes = uint64ToBytes(counter);
  const algoName = algorithm === 'SHA-1' ? 'SHA-1' : algorithm === 'SHA-256' ? 'SHA-256' : 'SHA-512';

  const hash = await hmac(algoName, secretBytes, counterBytes);
  return dynamicTruncation(hash, digits);
}

export async function verifyTOTP(options: VerifyTOTPOptions): Promise<{ valid: boolean; timestamp?: number }> {
  const { token, window = 1, timestamp = Date.now(), period = 30, ...totpOptions } = options;

  if (!/^\d+$/.test(token)) {
    return { valid: false };
  }

  const currentPeriod = Math.floor(timestamp / 1000 / period);

  for (let i = -window; i <= window; i++) {
    const testPeriod = currentPeriod + i;
    const testTimestamp = testPeriod * period * 1000;
    const expectedToken = await generateTOTP({
      ...totpOptions,
      timestamp: testTimestamp,
      period,
    });

    if (token === expectedToken) {
      return { valid: true, timestamp: testTimestamp };
    }
  }

  return { valid: false };
}

const kvKeyTemplate = (purpose: VerificationPurpose, email: string) => `totp:${purpose}:${email}`;

export async function createVerificationCode(email: string, purpose: VerificationPurpose, context: Readonly<RouterContextProvider>, metadata?: Record<string, unknown>): Promise<Result<string>> {
  try {
    const authConfig = getContext(context, authConfigContext);
    if (!authConfig) {
      return err('Auth configuration not found');
    }

    const env = getBindings(context);
    const kv = env[authConfig.session.kvBinding as keyof typeof env] as KVNamespace;
    if (!kv) {
      return err(`KV binding '${authConfig.session.kvBinding}' not found`);
    }

    const secret = base32Encode(generateSecret());
    const period = authConfig.verification.period;
    const digits = authConfig.verification.digits;

    const code = await generateTOTP({ secret, period, digits });

    const verificationData: StoredVerification = {
      secret,
      expireAt: Date.now() + period * 1000,
      attempts: 0,
      purpose,
      metadata,
    };

    await kv.put(kvKeyTemplate(purpose, email), JSON.stringify(verificationData), { expirationTtl: period });

    logger.info('verification_code_created', { email, purpose });

    return ok(code);
  } catch (error) {
    logger.error('verification_code_creation_failed', {
      email,
      purpose,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return err('Failed to create verification code', { error });
  }
}

export async function verifyCode(email: string, code: string, purpose: VerificationPurpose, context: Readonly<RouterContextProvider>): Promise<Result<StoredVerification>> {
  try {
    const authConfig = getContext(context, authConfigContext);
    if (!authConfig) {
      return err('Auth configuration not found');
    }

    const env = getBindings(context);
    const kv = env[authConfig.session.kvBinding as keyof typeof env] as KVNamespace;
    if (!kv) {
      return err(`KV binding '${authConfig.session.kvBinding}' not found`);
    }

    const kvKey = kvKeyTemplate(purpose, email);
    const storedData = await kv.get(kvKey);

    if (!storedData) {
      logger.warning('verification_code_not_found', { email, purpose });
      return err('Verification code expired or not found');
    }

    const verification: StoredVerification = JSON.parse(storedData);

    // Check purpose match
    if (verification.purpose !== purpose) {
      logger.warning('verification_purpose_mismatch', {
        email,
        expected: purpose,
        actual: verification.purpose,
      });
      return err('Invalid verification code');
    }

    // Check max attempts
    if (verification.attempts >= authConfig.verification.maxAttempts) {
      await kv.delete(kvKey);
      logger.warning('verification_max_attempts', { email, purpose });
      return err('Maximum verification attempts reached');
    }

    // Check expiration
    if (Date.now() > verification.expireAt) {
      await kv.delete(kvKey);
      logger.warning('verification_expired', { email, purpose });
      return err('Verification code has expired');
    }

    // Verify the code
    const result = await verifyTOTP({
      secret: verification.secret,
      token: code,
      period: authConfig.verification.period,
      digits: authConfig.verification.digits,
      window: authConfig.verification.window,
    });

    if (!result.valid) {
      // Increment attempts
      await kv.put(kvKey, JSON.stringify({ ...verification, attempts: verification.attempts + 1 }), { expirationTtl: authConfig.verification.period });
      logger.warning('verification_code_invalid', { email, purpose, attempts: verification.attempts + 1 });
      return err('Invalid verification code');
    }

    // Success - delete the verification data
    await kv.delete(kvKey);
    logger.info('verification_code_verified', { email, purpose });

    return ok(verification);
  } catch (error) {
    logger.error('verification_code_verification_failed', {
      email,
      purpose,
      error: error instanceof Error ? error.message : String(error),
    });
    return err('Failed to verify code', { error });
  }
}
