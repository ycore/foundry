import { getContext } from '@ycore/forge/context';
import type { IntentHandlers } from '@ycore/forge/intent/server';
import { handleIntent } from '@ycore/forge/intent/server';
import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, isSystemError, ok, respondError, respondOk, respondRedirect, throwSystemError, validateFormData } from '@ycore/forge/result';
import { requireCSRFToken } from '@ycore/foundry/secure/server';
import type { RouterContextProvider } from 'react-router';
import { email, minLength, object, pipe, string } from 'valibot';
import { defaultAuthRoutes } from '../auth.config';
import { authConfigContext } from './auth.context';
import { requestAccountRecovery } from './recovery-service';
import { createAuthSession } from './session';

const recoverFormSchema = object({
  email: pipe(string(), minLength(1, 'Email is required'), email('Must be a valid email address')),
});

export interface RecoverLoaderArgs {
  context: Readonly<RouterContextProvider>;
}

export interface RecoverActionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

/**
 * Recover page loader
 * Returns CSRF token
 */
export async function recoverLoader({ context }: RecoverLoaderArgs) {
  const token = requireCSRFToken(context);

  return respondOk({
    token,
  });
}

/**
 * Recover page action
 * Handles account recovery request using intent-based routing
 */
export async function recoverAction({ request, context }: RecoverActionArgs) {
  const formData = await request.formData();
  const authConfig = getContext(context, authConfigContext);

  // Define intent handlers
  const handlers: IntentHandlers = {
    /**
     * Request account recovery
     */
    recover: async (formData: FormData) => {
      // Validate form data
      const validationResult = await validateFormData(recoverFormSchema, formData);
      if (isError(validationResult)) {
        return validationResult; // User error - no logging needed
      }

      const { email } = validationResult;

      // Request account recovery (returns user if email exists, null otherwise)
      const result = await requestAccountRecovery(email, context);

      if (isError(result)) {
        // System error - email service failure
        if (isSystemError(result)) {
          logger.error('recover_email_system_error', { email, error: flattenError(result) });
        }
        return result;
      }

      const user = result;

      // If user exists, create session and redirect to verify
      if (user) {
        const sessionResult = await createAuthSession(context, { user });

        if (isError(sessionResult)) {
          // System error - session creation failed
          if (isSystemError(sessionResult)) {
            logger.error('recover_session_system_error', { userId: user.id, email, error: flattenError(sessionResult) });
          }
          return err('Failed to create recovery session');
        }

        // Return success with session cookie and redirect info
        return ok({
          message: 'If this email exists, a verification code has been sent.',
          redirectTo: authConfig?.routes.verify || defaultAuthRoutes.verify,
          sessionCookie: sessionResult,
        });
      }

      // Email doesn't exist - return generic message (prevent enumeration)
      return ok({
        message: 'If this email exists, a verification code has been sent.',
      });
    },
  };

  // Handle intent
  const result = await handleIntent(formData, handlers);

  if (isError(result)) {
    // System error - throw to boundary
    if (isSystemError(result)) {
      logger.error('recover_system_error', { error: flattenError(result) });
      throwSystemError(result.message, result.status as 503);
    }

    // User error - show in form
    return respondError(result);
  }

  const resultData = result as { message?: string; redirectTo?: string; sessionCookie?: string };

  // If we have a redirect with session cookie, use it
  if (resultData.redirectTo && resultData.sessionCookie) {
    throw respondRedirect(resultData.redirectTo, {
      headers: { 'Set-Cookie': resultData.sessionCookie },
    });
  }

  // Otherwise just return success (email didn't exist, stay on page)
  return respondOk(result);
}
