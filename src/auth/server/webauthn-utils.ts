import { getContext } from '@ycore/forge/context';
import { logger } from '@ycore/forge/logger';
import { err, isError, ok, type Result } from '@ycore/forge/result';
import { authConfigContext } from '@ycore/foundry/auth';
import type { RouterContextProvider } from 'react-router';
import { defaultAuthRoutes } from '../auth.config';
import type { User } from '../schema';
import { createAuthSession } from './session';

/**
 * Parse WebAuthn credential from FormData
 *
 * @param formData - The form data containing webauthn_response
 * @param operation - The operation being performed (for error messages)
 * @returns Result with parsed credential or error
 *
 * @example
 * ```ts
 * const result = parseWebAuthnCredential(formData, 'signin');
 * if (isError(result)) {
 *   return respondError(result);
 * }
 * const credential = result;
 * ```
 */
export function parseWebAuthnCredential(formData: FormData, operation: 'signin' | 'signup' | 'add-passkey'): Result<any> {
  const webauthnResponse = formData.get('webauthn_response')?.toString();

  if (!webauthnResponse) {
    const errorMessage = operation === 'signin' ? 'Authentication failed. Please try again.' : 'Registration failed. Please try again.';
    logger.warning(`${operation}_missing_webauthn_response`);
    return err(errorMessage, { field: 'general' });
  }

  try {
    const credential = JSON.parse(webauthnResponse);
    return ok(credential);
  } catch (error) {
    logger.error(`${operation}_webauthn_parse_error`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return err('Invalid authentication data. Please try again.', { field: 'general' });
  }
}

/**
 * Create authenticated session with standardized error handling
 *
 * @param context - Router context provider
 * @param user - The authenticated user
 * @param email - User's email for logging
 * @param operation - The operation being performed (for logging)
 * @returns Result with cookie string or error
 *
 * @example
 * ```ts
 * const result = await createAuthenticatedSession(context, user, user.email, 'signin');
 * if (isError(result)) {
 *   return respondError(result);
 * }
 * const cookie = result;
 * ```
 */
export async function createAuthenticatedSession(context: Readonly<RouterContextProvider>, user: User, email: string, operation: 'signin' | 'signup'): Promise<Result<string>> {
  const sessionResult = await createAuthSession(context, { user });

  if (isError(sessionResult)) {
    logger.error(`${operation}_session_creation_failed`, {
      email,
      userId: user.id,
      error: sessionResult.message,
    });
    return err('Failed to create session', { field: 'general' });
  }

  return ok(sessionResult);
}

/**
 * Create auth success response with redirect
 *
 * @param context - Router context provider
 * @param cookie - The Set-Cookie header value
 * @returns Object with redirectTo and cookie for redirect response
 *
 * @example
 * ```ts
 * const response = createAuthSuccessResponse(context, cookie);
 * return ok(response);
 * ```
 */
export function createAuthSuccessResponse(context: Readonly<RouterContextProvider>, cookie: string): { redirectTo: string; cookie: string } {
  const authConfig = getContext(context, authConfigContext);
  const redirectTo = authConfig?.routes.signedin || defaultAuthRoutes.signedin;

  return { redirectTo, cookie };
}
