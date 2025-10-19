import { decodeBase64url } from '@oslojs/encoding';
import { logger } from '@ycore/forge/logger';
import { err, isError, ok, type Result } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';
import { WebAuthnErrorCode } from '../auth.constants';
import { verifyChallengeUniqueness } from './session';
import { resolveOrigins, resolveRpId, validateOrigin } from './webauthn-config';

/**
 * Result of WebAuthn validation containing validated challenge, origin, and rpId
 */
export interface WebAuthnValidationResult {
  challenge: string;
  origin: string;
  rpId: string;
}

/**
 * Options for challenge validation
 */
export interface ChallengeValidationOptions {
  /**
   * The stored challenge from session
   */
  storedChallenge: string;

  /**
   * When the challenge was created (timestamp)
   */
  challengeCreatedAt: number;

  /**
   * Maximum age of challenge in milliseconds (default: 5 minutes)
   */
  maxAge?: number;
}

/**
 * Options for origin validation
 */
export interface OriginValidationOptions {
  /**
   * The client data JSON from WebAuthn credential
   */
  clientDataJSON: string;

  /**
   * Additional context for logging (e.g., email, userId)
   */
  logContext?: Record<string, unknown>;

  /**
   * The operation being performed (for logging)
   */
  operation: 'signin' | 'signup' | 'add-passkey';
}

/**
 * Validates a WebAuthn challenge for expiration and uniqueness
 *
 * This function performs three critical security checks:
 * 1. Verifies challenge exists in session
 * 2. Checks challenge hasn't expired (default 5 minutes)
 * 3. Verifies challenge uniqueness to prevent replay attacks
 *
 * @param options - Challenge validation options
 * @param context - Router context for KV access
 * @returns Result with success or error details
 *
 * @example
 * ```ts
 * const result = await validateChallenge({
 *   storedChallenge: session.get('challenge'),
 *   challengeCreatedAt: session.get('challengeCreatedAt'),
 * }, context);
 *
 * if (isError(result)) {
 *   return respondError(result);
 * }
 * ```
 */
export async function validateChallenge(options: ChallengeValidationOptions, context: Readonly<RouterContextProvider>): Promise<Result<void>> {
  const { storedChallenge, challengeCreatedAt, maxAge = 5 * 60 * 1000 } = options;

  // Check challenge expiration
  if (Date.now() - challengeCreatedAt > maxAge) {
    return err('Session expired. Please refresh and try again.', {
      field: 'general',
      code: WebAuthnErrorCode.CHALLENGE_EXPIRED,
    });
  }

  // Verify challenge uniqueness (prevents replay attacks)
  const uniquenessResult = await verifyChallengeUniqueness(storedChallenge, context);
  if (!uniquenessResult) {
    return err('Invalid challenge. Please refresh and try again.', {
      field: 'general',
      code: WebAuthnErrorCode.INVALID_CHALLENGE,
    });
  }

  // Return success (void)
  return ok(undefined);
}

/**
 * Validates WebAuthn origin using server-determined origin (not client-provided)
 *
 * This function implements critical security measures:
 * 1. Uses server-determined origin from request URL (NOT client data)
 * 2. Validates server origin is in allowed origins list
 * 3. Parses client data and verifies origin matches server origin
 * 4. Prevents origin confusion attacks
 *
 * @param request - The incoming request
 * @param options - Origin validation options
 * @param context - Router context
 * @returns Result with validated origin or error
 *
 * @example
 * ```ts
 * const result = await validateOrigin(request, {
 *   clientDataJSON: credential.response.clientDataJSON,
 *   operation: 'signin',
 *   logContext: { email: user.email }
 * }, context);
 *
 * if (isError(result)) {
 *   return respondError(result);
 * }
 *
 * const { origin } = result;
 * ```
 */
export async function validateWebAuthnOrigin(request: Request, options: OriginValidationOptions, context: Readonly<RouterContextProvider>): Promise<Result<string>> {
  const { clientDataJSON, logContext = {}, operation } = options;

  // Resolve allowed origins from configuration
  const allowedOrigins = resolveOrigins(context, request);

  // SECURITY: Use server-determined origin, not client-provided
  // The server determines the origin from the request URL
  const serverOrigin = new URL(request.url).origin;

  // Verify the server origin is in our allowed origins (sanity check)
  if (!validateOrigin(serverOrigin, allowedOrigins)) {
    logger.error(`${operation}_server_origin_not_allowed`, {
      serverOrigin,
      allowedOrigins,
      ...logContext,
    });

    return err('Server configuration error', { field: 'general' });
  }

  // Parse client data to verify origin matches server-determined origin
  const clientData = JSON.parse(new TextDecoder().decode(decodeBase64url(clientDataJSON))) as { origin: string };
  const clientOrigin = clientData.origin;

  // SECURITY: Verify client-provided origin matches server-determined origin
  // This prevents origin confusion attacks
  if (clientOrigin !== serverOrigin) {
    return err('Origin mismatch', { field: 'general' });
  }

  return ok(serverOrigin);
}

/**
 * Validates a complete WebAuthn request including challenge and origin
 *
 * This is a convenience function that combines challenge and origin validation
 * in a single call. Use this when you need both validations.
 *
 * @param request - The incoming request
 * @param options - Combined validation options
 * @param context - Router context
 * @returns Result with validation data or error
 *
 * @example
 * ```ts
 * const result = await validateWebAuthnRequest(request, {
 *   storedChallenge: session.get('challenge'),
 *   challengeCreatedAt: session.get('challengeCreatedAt'),
 *   clientDataJSON: credential.response.clientDataJSON,
 *   operation: 'signin',
 *   logContext: { email: user.email }
 * }, context);
 *
 * if (isError(result)) {
 *   return respondError(result);
 * }
 *
 * const { challenge, origin, rpId } = result;
 * ```
 */
export async function validateWebAuthnRequest(request: Request, options: ChallengeValidationOptions & OriginValidationOptions, context: Readonly<RouterContextProvider>): Promise<Result<WebAuthnValidationResult>> {
  const { storedChallenge, challengeCreatedAt, clientDataJSON, logContext, operation, maxAge } = options;

  // Validate challenge
  const challengeResult = await validateChallenge({ storedChallenge, challengeCreatedAt, maxAge }, context);

  if (isError(challengeResult)) {
    return challengeResult;
  }

  // Validate origin
  const originResult = await validateWebAuthnOrigin(request, { clientDataJSON, logContext, operation }, context);

  if (isError(originResult)) {
    return originResult;
  }

  // Resolve RP ID
  const rpId = resolveRpId(context, request);

  return ok({ challenge: storedChallenge, origin: originResult, rpId });
}
