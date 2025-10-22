import type { IntentHandlers } from '@ycore/forge/intent/server';
import { handleIntent } from '@ycore/forge/intent/server';
import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, respondError, respondOk, validateFormData } from '@ycore/forge/result';
import { requireCSRFToken } from '@ycore/foundry/secure/server';
import type { RouterContextProvider } from 'react-router';
import { redirect } from 'react-router';
import { email, minLength, object, pipe, string } from 'valibot';

import type { EmailConfig } from '../../email/@types/email.types';
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
  emailConfig: EmailConfig;
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
export async function recoverAction({ request, context, emailConfig }: RecoverActionArgs) {
  const formData = await request.formData();

  // Define intent handlers
  const handlers: IntentHandlers = {
    /**
     * Request account recovery
     */
    recover: async (formData: FormData) => {
      // Validate form data
      const validationResult = await validateFormData(recoverFormSchema, formData);
      if (isError(validationResult)) {
        logger.warning('recover_validation_failed', {
          error: flattenError(validationResult),
        });
        return validationResult;
      }

      const { email } = validationResult;

      logger.info('recover_request_initiated', { email });

      // Request account recovery (returns user if email exists, null otherwise)
      const result = await requestAccountRecovery(email, context, emailConfig);

      if (isError(result)) {
        logger.error('recover_request_failed', {
          email,
          error: flattenError(result),
        });
        return result;
      }

      const user = result;

      logger.info('recover_request_completed', { email, userExists: user !== null });

      // If user exists, create session and redirect to verify
      if (user) {
        const sessionResult = await createAuthSession(context, { user });

        if (isError(sessionResult)) {
          logger.error('recover_session_creation_failed', {
            userId: user.id,
            email,
            error: flattenError(sessionResult),
          });
          return err('Failed to create recovery session');
        }

        logger.info('recovery_session_created', { userId: user.id, email });

        // Return success with session cookie and redirect info
        return ok({
          success: true,
          message: 'If this email exists, a verification code has been sent.',
          redirectTo: '/auth/verify',
          sessionCookie: sessionResult,
        });
      }

      // Email doesn't exist - return generic message (prevent enumeration)
      return ok({
        success: true,
        message: 'If this email exists, a verification code has been sent.',
      });
    },
  };

  // Handle intent
  const result = await handleIntent(formData, handlers);

  if (isError(result)) {
    logger.warning('recover_intent_failed', {
      error: flattenError(result),
    });
    return respondError(result);
  }

  const resultData = result as any;

  // If we have a redirect with session cookie, use it
  if (resultData.redirectTo && resultData.sessionCookie) {
    throw redirect(resultData.redirectTo, {
      headers: { 'Set-Cookie': resultData.sessionCookie },
    });
  }

  // Otherwise just return success (email didn't exist, stay on page)
  return respondOk(result);
}
