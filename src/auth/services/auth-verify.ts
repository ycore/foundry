import type { IntentHandlers } from '@ycore/forge/intent/server';
import { handleIntent } from '@ycore/forge/intent/server';
import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, respondError, respondOk, validateFormData } from '@ycore/forge/result';
import { getAuthConfig } from '@ycore/foundry/auth';
import { csrfContext } from '@ycore/foundry/secure/services';
import type { RouterContextProvider } from 'react-router';
import { redirect } from 'react-router';
import { minLength, object, pipe, string } from 'valibot';

import type { EmailConfig } from '../../email/@types/email.types';
import { getAuthRepository } from './repository';
import { getAuthSession } from './session';
import { type VerificationPurpose, verifyCode } from './totp-service';
import { sendVerificationEmail } from './verification-service';

const verifyFormSchema = object({
  email: pipe(string(), minLength(1, 'Email is required')),
  code: pipe(string(), minLength(6, 'Code must be 6 digits')),
});

export interface VerifyLoaderArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

export interface VerifyActionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
  emailConfig: EmailConfig;
}

/**
 * Verify page loader
 * Returns user email and CSRF token
 */
export async function verifyLoader({ request, context }: VerifyLoaderArgs) {
  const csrfData = context.get(csrfContext);
  const sessionResult = await getAuthSession(request, context);

  if (isError(sessionResult)) {
    logger.warning('verify_loader_no_session');
    return respondError(err('Failed to get session'));
  }

  const session = sessionResult;
  if (!session || !session.user) {
    const authConfig = getAuthConfig(context);
    logger.warning('verify_loader_no_user');
    throw redirect(authConfig?.routes.signin || '/auth/signin');
  }

  return respondOk({
    csrfData,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
  });
}

/**
 * Verify page action
 * Handles code verification and resend using intent-based routing
 */
export async function verifyAction({ request, context, emailConfig }: VerifyActionArgs) {
  const repository = getAuthRepository(context);
  const authConfig = getAuthConfig(context);

  if (!authConfig) {
    logger.error('verify_action_no_config');
    return respondError(err('Auth configuration not found'));
  }

  const formData = await request.formData();
  const purpose = (formData.get('purpose')?.toString() as VerificationPurpose) || 'signup';

  // Get session once for all handlers
  const sessionResult = await getAuthSession(request, context);

  if (isError(sessionResult)) {
    logger.warning('verify_action_no_session');
    return respondError(err('Failed to get session'));
  }

  const session = sessionResult;
  if (!session || !session.user) {
    logger.warning('verify_action_no_user');
    return respondError(err('No active session found'));
  }

  // Define intent handlers
  const handlers: IntentHandlers = {
    /**
     * Resend verification code
     */
    resend: async () => {
      logger.info('verify_resend_requested', { email: session.user.email, purpose });

      // Send the verification email (this handles code generation internally)
      const sendResult = await sendVerificationEmail({
        email: session.user.email,
        purpose,
        context,
        emailConfig,
      });

      if (isError(sendResult)) {
        logger.error('verify_resend_email_failed', {
          email: session.user.email,
          purpose,
          error: flattenError(sendResult),
        });
        return sendResult;
      }

      logger.info('verify_code_resent', { email: session.user.email, purpose });

      // Return success to trigger cooldown in UI
      return ok({ resent: true });
    },

    /**
     * Unverify email (set emailVerified to false)
     */
    unverify: async () => {
      logger.info('verify_unverify_requested', { email: session.user.email });

      // Update email verified status to false
      const updateResult = await repository.updateEmailVerified(session.user.id, false);

      if (isError(updateResult)) {
        logger.error('verify_unverify_failed', {
          userId: session.user.id,
          error: flattenError(updateResult),
        });
        return updateResult;
      }

      logger.info('email_unverified', { email: session.user.email });

      return ok({ unverified: true });
    },

    /**
     * Verify the code
     */
    verify: async (formData: FormData) => {
      // Validate form data
      const validationResult = await validateFormData(verifyFormSchema, formData);
      if (isError(validationResult)) {
        logger.warning('verify_validation_failed', {
          error: flattenError(validationResult),
        });
        return validationResult;
      }

      const { email, code } = validationResult;

      // Check session email matches
      if (session.user.email !== email) {
        logger.warning('verify_session_mismatch', {
          sessionEmail: session.user.email,
          requestEmail: email,
        });
        return err('Session mismatch', { email: 'Email does not match session' });
      }

      // Verify the code
      const verifyResult = await verifyCode(email, code, purpose, context);

      if (isError(verifyResult)) {
        logger.warning('verify_code_invalid', {
          email,
          purpose,
          error: flattenError(verifyResult),
        });
        return err(verifyResult.message, { code: verifyResult.message });
      }

      const verification = verifyResult;

      // Get user from database
      const userResult = await repository.getUserByEmail(email);

      if (isError(userResult)) {
        logger.error('verify_user_not_found', { email });
        return err('User not found');
      }

      const user = userResult;

      // Handle different verification purposes
      switch (purpose) {
        case 'signup':
        case 'email-change': {
          // Update email verified status
          const updateResult = await repository.updateEmailVerified(user.id, true);

          if (isError(updateResult)) {
            logger.error('verify_update_failed', { userId: user.id, purpose });
            return err('Failed to update verification status');
          }

          logger.info('email_verified', { email, purpose });
          throw redirect(authConfig.routes.signedin);
        }

        case 'passkey-add':
        case 'passkey-delete':
        case 'account-delete': {
          // These will be handled by their respective action handlers
          // Return success with metadata for further processing
          logger.info('verification_completed', { email, purpose });
          return ok({
            verified: true,
            purpose,
            metadata: verification.metadata,
          });
        }

        default: {
          logger.warning('verify_unknown_purpose', { purpose });
          return err('Unknown verification purpose');
        }
      }
    },
  };

  // Handle intent
  const result = await handleIntent(formData, handlers);

  if (isError(result)) {
    logger.warning('verify_intent_failed', {
      error: flattenError(result),
      email: session.user.email,
    });
    return respondError(result);
  }

  return respondOk(result);
}
