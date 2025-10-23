import { getContext } from '@ycore/forge/context';
import type { IntentHandlers } from '@ycore/forge/intent/server';
import { handleIntent } from '@ycore/forge/intent/server';
import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, isSystemError, ok, respondError, respondOk, respondRedirect, throwSystemError, validateFormData } from '@ycore/forge/result';
import { requireCSRFToken } from '@ycore/foundry/secure/server';
import type { RouterContextProvider } from 'react-router';
import { minLength, object, pipe, string } from 'valibot';
import { defaultAuthRoutes } from '../auth.config';
import { authConfigContext } from './auth.context';
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
}

/**
 * Verify page loader
 * Returns user email and CSRF token
 */
export async function verifyLoader({ request, context }: VerifyLoaderArgs) {
  const token = requireCSRFToken(context);
  const sessionResult = await getAuthSession(request, context);

  if (isError(sessionResult)) {
    // System error - session service failure
    if (isSystemError(sessionResult)) {
      logger.error('verify_loader_session_error', { error: flattenError(sessionResult) });
      throwSystemError(sessionResult.message, sessionResult.status as 503);
    }
    return respondError(err('Failed to get session'));
  }

  const session = sessionResult;
  if (!session || !session.user) {
    const authConfig = getContext(context, authConfigContext);
    throw respondRedirect(authConfig?.routes.signin || defaultAuthRoutes.signin);
  }

  // Determine verification purpose based on pending state
  let emailToVerify = session.user.email;
  let purpose: VerificationPurpose = 'signup';

  // Check for pending operations
  if (session.user.pending?.type === 'email-change') {
    emailToVerify = session.user.pending.email;
    purpose = 'email-change';

    logger.info('verify_loader_email_change_detected', { userId: session.user.id, oldEmail: session.user.email, newEmail: emailToVerify });
  } else if (session.user.pending?.type === 'account-delete') {
    purpose = 'account-delete';

    logger.info('verify_loader_account_delete_detected', { userId: session.user.id, email: session.user.email });
  }

  return respondOk({
    token,
    email: emailToVerify,
    status: session.user.status,
    purpose,
  });
}

/**
 * Verify page action
 * Handles code verification and resend using intent-based routing
 */
export async function verifyAction({ request, context }: VerifyActionArgs) {
  const repository = getAuthRepository(context);
  const authConfig = getContext(context, authConfigContext);
  const formData = await request.formData();
  const purpose = (formData.get('purpose')?.toString() as VerificationPurpose) || 'signup';

  // Get session once for all handlers
  const sessionResult = await getAuthSession(request, context);

  if (isError(sessionResult)) {
    // System error - session service failure
    if (isSystemError(sessionResult)) {
      logger.error('verify_action_session_error', { error: flattenError(sessionResult) });
      throwSystemError(sessionResult.message, sessionResult.status as 503);
    }
    return respondError(err('Failed to get session'));
  }

  const session = sessionResult;
  if (!session || !session.user) {
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
      if (purpose === 'email-change' && session.user.pending?.type === 'email-change') {
        emailToSendTo = session.user.pending.email;
        logger.info('verify_resend_email_change', {
          userId: session.user.id,
          oldEmail: session.user.email,
          newEmail: emailToSendTo,
        });
      }

      // Send the verification email (this handles code generation internally)
      const sendResult = await sendVerificationEmail({
        email: emailToSendTo,
        purpose,
        context,
      });

      if (isError(sendResult)) {
        // System error - email service failure
        if (isSystemError(sendResult)) {
          logger.error('verify_resend_email_system_error', { email: emailToSendTo, purpose, error: flattenError(sendResult) });
        }
        return sendResult;
      }

      // Return success to trigger cooldown in UI
      return ok({ resent: true });
    },

    /**
     * Unverify user (set status to unverified)
     */
    unverify: async () => {
      // Update user status to unverified
      const updateResult = await repository.updateUserStatus(session.user.id, 'unverified');

      if (isError(updateResult)) {
        // System error - database failure
        if (isSystemError(updateResult)) {
          logger.error('verify_unverify_system_error', { userId: session.user.id, error: flattenError(updateResult) });
        }
        return updateResult;
      }

      return ok({ unverified: true });
    },

    /**
     * Verify the code
     */
    verify: async (formData: FormData) => {
      // Validate form data
      const validationResult = await validateFormData(verifyFormSchema, formData);
      if (isError(validationResult)) {
        return validationResult; // User error - no logging needed
      }

      const { email, code } = validationResult;

      // For email-change, email will be the NEW email, not session email
      // So we skip the session email check for email-change purpose
      if (purpose !== 'email-change') {
        // Check session email matches for non-email-change purposes
        if (session.user.email !== email) {
          return err('Session mismatch', { email: 'Email does not match session' });
        }
      }

      // Verify the code
      const verifyResult = await verifyCode(email, code, purpose, context);

      if (isError(verifyResult)) {
        return err(verifyResult.message, { code: verifyResult.message }); // User error
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
        // System error or data inconsistency
        logger.error('verify_user_not_found', { email, purpose, userId: session.user.id, error: flattenError(userResult) });
        return err('User not found', undefined, { status: 500 });
      }

      const user = userResult;

      // Handle different verification purposes
      switch (purpose) {
        case 'signup': {
          // Update user status to active
          const updateResult = await repository.updateUserStatus(user.id, 'active');

          if (isError(updateResult)) {
            // System error - database failure
            if (isSystemError(updateResult)) {
              logger.error('verify_update_system_error', { userId: user.id, purpose, error: flattenError(updateResult) });
            }
            return updateResult;
          }

          // Update session with active status (important for auth context)
          const updatedUser = {
            ...user,
            status: 'active' as const,
          };

          const sessionUpdateResult = await updateAuthSession(request, context, { user: updatedUser });

          if (isError(sessionUpdateResult)) {
            // Log but continue - status was updated in DB
            logger.warning('verify_session_update_failed', { userId: user.id, error: flattenError(sessionUpdateResult) });
          }

          // Return redirect info
          return ok({
            sessionCookie: isError(sessionUpdateResult) ? undefined : sessionUpdateResult,
            redirectTo: authConfig?.routes.signedin || defaultAuthRoutes.signedin,
          });
        }

        case 'email-change': {
          // Get pending email change from user.pending field
          if (!user.pending || user.pending.type !== 'email-change') {
            logger.error('verify_email_change_no_pending_request', { userId: user.id, email });
            return err('No pending email change request found. Request may have expired.');
          }

          const newEmail = user.pending.email;
          const oldEmail = user.email;

          // Verify the email matches the new email in the pending field
          if (email !== newEmail) {
            logger.error('verify_email_change_email_mismatch', {
              userId: user.id,
              expectedEmail: newEmail,
              actualEmail: email,
            });
            return err('Email mismatch. Please try again.');
          }

          // Update user email (repository sets status to 'unverified' by default)
          const updateResult = await repository.updateUserEmail(user.id, newEmail);

          if (isError(updateResult)) {
            // System error - database failure
            if (isSystemError(updateResult)) {
              logger.error('verify_email_change_update_system_error', { userId: user.id, error: flattenError(updateResult) });
            }
            return updateResult;
          }

          // Set status to 'active' since we just verified the new email
          const verifyResult = await repository.updateUserStatus(user.id, 'active');

          if (isError(verifyResult)) {
            // Log but don't fail - email was already updated
            logger.warning('verify_email_change_status_update_failed', { userId: user.id, error: flattenError(verifyResult) });
          }

          // Clear pending field
          const pendingClearResult = await repository.updateUserPending(user.id, null);

          if (isError(pendingClearResult)) {
            // Log but don't fail
            logger.warning('verify_email_change_pending_clear_failed', {
              userId: user.id,
              error: flattenError(pendingClearResult),
            });
          }

          // Update session with new email and status (important for auth context)
          const updatedUser = {
            ...user,
            email: newEmail,
            status: 'active' as const,
            pending: null,
          };

          const sessionUpdateResult = await updateAuthSession(request, context, { user: updatedUser });

          if (isError(sessionUpdateResult)) {
            // Log but don't fail - email was already updated in DB
            logger.warning('verify_email_change_session_update_failed', { userId: user.id, error: flattenError(sessionUpdateResult) });
          }

          logger.info('email_changed_successfully', {
            userId: user.id,
            oldEmail,
            newEmail,
          });

          // Return redirect info (back to profile page for profile management actions)
          return ok({
            sessionCookie: isError(sessionUpdateResult) ? undefined : sessionUpdateResult,
            redirectTo: authConfig?.routes.profile || defaultAuthRoutes.profile,
          });
        }

        case 'recovery': {
          // User has verified their email for recovery
          // Redirect to signup page for passkey registration
          logger.info('recovery_email_verified', { userId: user.id, email });

          return ok({
            redirectTo: authConfig?.routes.signup || defaultAuthRoutes.signup,
          });
        }

        case 'account-delete': {
          // User has verified their email for account deletion
          // Check if user has pending account delete
          if (!user.pending || user.pending.type !== 'account-delete') {
            logger.error('verify_account_delete_no_pending_request', { userId: user.id, email });
            return err('No pending account deletion request found. Request may have expired.');
          }

          // Delete the account (anonymize email, set status to deleted)
          const deleteResult = await repository.deleteUserAccount(user.id);

          if (isError(deleteResult)) {
            // System error - database failure
            if (isSystemError(deleteResult)) {
              logger.error('verify_account_delete_system_error', { userId: user.id, error: flattenError(deleteResult) });
            }
            return deleteResult;
          }

          logger.info('account_deleted_successfully', {
            userId: user.id,
            email,
          });

          // Destroy session and redirect to signout
          return ok({
            redirectTo: authConfig?.routes.signedout || defaultAuthRoutes.signedout,
            destroySession: true,
          });
        }

        case 'passkey-add':
        case 'passkey-delete': {
          // These will be handled by their respective action handlers
          return ok({
            verified: true,
            purpose,
            metadata: verification.metadata,
          });
        }

        default: {
          return err('Unknown verification purpose');
        }
      }
    },
  };

  // Handle intent
  const result = await handleIntent(formData, handlers);

  if (isError(result)) {
    // System error
    if (isSystemError(result)) {
      logger.error('verify_system_error', { error: flattenError(result), email: session.user.email });
      throwSystemError(result.message, result.status as 503);
    }

    // User error
    return respondError(result);
  }

  // Check if result contains redirect info
  const resultData = result as any;
  if (resultData.redirectTo) {
    // Check if session should be destroyed (account deletion)
    if (resultData.destroySession) {
      const { destroyAuthSession } = await import('./session');
      const destroyResult = await destroyAuthSession(request, context);

      // Redirect with session destruction cookie
      throw respondRedirect(resultData.redirectTo, {
        headers: { 'Set-Cookie': !isError(destroyResult) ? destroyResult : '' },
      });
    }

    // Redirect with optional session cookie
    throw respondRedirect(resultData.redirectTo, {
      headers: resultData.sessionCookie ? { 'Set-Cookie': resultData.sessionCookie } : undefined,
    });
  }

  // Return data (for resend, unverify operations)
  return respondOk(result);
}
