import { getContext } from '@ycore/forge/context';
import type { IntentHandlers } from '@ycore/forge/intent/server';
import { handleIntent } from '@ycore/forge/intent/server';
import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, respondError, respondOk, validateFormData } from '@ycore/forge/result';
import { requireCSRFToken } from '@ycore/foundry/secure/server';
import type { RouterContextProvider } from 'react-router';
import { redirect } from 'react-router';
import { minLength, object, pipe, string } from 'valibot';

import type { EmailConfig } from '../../email/@types/email.types';
import { authConfigContext } from './auth.context';
import { deleteEmailChangeRequest, getEmailChangeRequest } from './email-change-service';
import { getAuthRepository } from './repository';
import { getAuthSession, updateAuthSession } from './session';
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
  const token = requireCSRFToken(context);
  const sessionResult = await getAuthSession(request, context);

  if (isError(sessionResult)) {
    logger.warning('verify_loader_no_session');
    return respondError(err('Failed to get session'));
  }

  const session = sessionResult;
  if (!session || !session.user) {
    const authConfig = getContext(context, authConfigContext);
    logger.warning('verify_loader_no_user');
    throw redirect(authConfig?.routes.signin || '/auth/signin');
  }

  // Check for pending email change
  const authConfig = getContext(context, authConfigContext);
  let emailToVerify = session.user.email;
  let purpose: VerificationPurpose = 'signup';

  if (authConfig?.session?.kvBinding) {
    const pendingChangeResult = await getEmailChangeRequest(session.user.id, context, authConfig.session.kvBinding);

    // If there's a pending email change, verify the NEW email instead
    if (!isError(pendingChangeResult) && pendingChangeResult) {
      emailToVerify = pendingChangeResult.newEmail;
      purpose = 'email-change';

      logger.info('verify_loader_email_change_detected', {
        userId: session.user.id,
        oldEmail: session.user.email,
        newEmail: emailToVerify,
      });
    }
  }

  return respondOk({
    token,
    email: emailToVerify,
    emailVerified: session.user.emailVerified,
    purpose,
  });
}

/**
 * Verify page action
 * Handles code verification and resend using intent-based routing
 */
export async function verifyAction({ request, context, emailConfig }: VerifyActionArgs) {
  const repository = getAuthRepository(context);
  const authConfig = getContext(context, authConfigContext);

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
      // Determine which email to send to based on purpose
      let emailToSendTo = session.user.email;

      // For email-change, send to the NEW email from pending change
      if (purpose === 'email-change' && authConfig.session?.kvBinding) {
        const pendingChangeResult = await getEmailChangeRequest(session.user.id, context, authConfig.session.kvBinding);

        if (!isError(pendingChangeResult) && pendingChangeResult) {
          emailToSendTo = pendingChangeResult.newEmail;
          logger.info('verify_resend_email_change', {
            userId: session.user.id,
            oldEmail: session.user.email,
            newEmail: emailToSendTo,
          });
        }
      }

      logger.info('verify_resend_requested', { email: emailToSendTo, purpose });

      // Send the verification email (this handles code generation internally)
      const sendResult = await sendVerificationEmail({
        email: emailToSendTo,
        purpose,
        context,
        emailConfig,
      });

      if (isError(sendResult)) {
        logger.error('verify_resend_email_failed', {
          email: emailToSendTo,
          purpose,
          error: flattenError(sendResult),
        });
        return sendResult;
      }

      logger.info('verify_code_resent', { email: emailToSendTo, purpose });

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

      // For email-change, email will be the NEW email, not session email
      // So we skip the session email check for email-change purpose
      if (purpose !== 'email-change') {
        // Check session email matches for non-email-change purposes
        if (session.user.email !== email) {
          logger.warning('verify_session_mismatch', {
            sessionEmail: session.user.email,
            requestEmail: email,
            purpose,
          });
          return err('Session mismatch', { email: 'Email does not match session' });
        }
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
      // For email-change, use session user ID instead of email lookup
      // because the email in the form is the NEW email which doesn't exist yet
      let userResult;
      if (purpose === 'email-change') {
        userResult = await repository.getUserById(session.user.id);
      } else {
        userResult = await repository.getUserByEmail(email);
      }

      if (isError(userResult)) {
        logger.error('verify_user_not_found', { email, purpose, userId: session.user.id });
        return err('User not found');
      }

      const user = userResult;

      // Handle different verification purposes
      switch (purpose) {
        case 'signup': {
          // Update email verified status
          const updateResult = await repository.updateEmailVerified(user.id, true);

          if (isError(updateResult)) {
            logger.error('verify_update_failed', { userId: user.id, purpose });
            return err('Failed to update verification status');
          }

          logger.info('email_verified', { email, purpose });
          throw redirect(authConfig.routes.signedin);
        }

        case 'email-change': {
          // Get pending email change request
          if (!authConfig.session?.kvBinding) {
            logger.error('verify_email_change_no_kv_binding');
            return err('Email change service not configured');
          }

          const pendingChangeResult = await getEmailChangeRequest(user.id, context, authConfig.session.kvBinding);

          if (isError(pendingChangeResult)) {
            logger.error('verify_email_change_no_pending_request', { userId: user.id, email });
            return err('No pending email change request found. Request may have expired.');
          }

          const pendingChange = pendingChangeResult;

          if (!pendingChange) {
            logger.error('verify_email_change_missing_request', { userId: user.id, email });
            return err('No pending email change request found. Request may have expired.');
          }

          // Verify the email matches the new email in the pending request
          if (email !== pendingChange.newEmail) {
            logger.error('verify_email_change_email_mismatch', {
              userId: user.id,
              expectedEmail: pendingChange.newEmail,
              actualEmail: email,
            });
            return err('Email mismatch. Please try again.');
          }

          // Update user email (repository sets emailVerified to false by default)
          const updateResult = await repository.updateUserEmail(user.id, pendingChange.newEmail);

          if (isError(updateResult)) {
            logger.error('verify_email_change_update_failed', { userId: user.id, error: flattenError(updateResult) });
            return err('Failed to update email address');
          }

          // Now set emailVerified to true since we just verified the new email
          const verifyResult = await repository.updateEmailVerified(user.id, true);

          if (isError(verifyResult)) {
            logger.error('verify_email_change_verify_failed', { userId: user.id, error: flattenError(verifyResult) });
            // Don't fail - email was already updated, just log the warning
            logger.warning('email_changed_but_not_verified', {
              userId: user.id,
              newEmail: pendingChange.newEmail,
            });
          }

          // Delete pending request
          const deleteResult = await deleteEmailChangeRequest(user.id, context, authConfig.session.kvBinding);

          if (isError(deleteResult)) {
            // Log warning but don't fail - email was already updated
            logger.warning('verify_email_change_cleanup_failed', {
              userId: user.id,
              error: flattenError(deleteResult),
            });
          }

          // Update session with new email (important for auth context)
          const updatedUser = {
            ...user,
            email: pendingChange.newEmail,
            emailVerified: true,
          };

          const sessionUpdateResult = await updateAuthSession(request, context, { user: updatedUser });

          if (isError(sessionUpdateResult)) {
            logger.error('verify_email_change_session_update_failed', {
              userId: user.id,
              error: flattenError(sessionUpdateResult),
            });
            // Don't fail - email was already updated in DB
            logger.warning('email_changed_session_not_updated', {
              userId: user.id,
              newEmail: pendingChange.newEmail,
            });
          }

          logger.info('email_changed_successfully', {
            userId: user.id,
            oldEmail: pendingChange.oldEmail,
            newEmail: pendingChange.newEmail,
            sessionUpdated: !isError(sessionUpdateResult),
          });

          // Return success with session cookie for action handler to process
          return ok({
            success: true,
            redirectTo: authConfig.routes.signedin,
            sessionCookie: !isError(sessionUpdateResult) ? sessionUpdateResult : undefined,
          });
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

  // Check if result contains redirect metadata (for email-change)
  const resultData = result as any;
  if (resultData.redirectTo && resultData.sessionCookie) {
    // Handle redirect with session cookie
    throw redirect(resultData.redirectTo, {
      headers: {
        'Set-Cookie': resultData.sessionCookie,
      },
    });
  }

  return respondOk(result);
}
