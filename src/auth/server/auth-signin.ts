import { decodeBase64url } from '@oslojs/encoding';
import { getContext } from '@ycore/forge/context';
import type { IntentHandlers } from '@ycore/forge/intent/server';
import { handleIntent } from '@ycore/forge/intent/server';
import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, isSystemError, ok, respondError, respondOk, respondRedirect, throwSystemError, transformError, validateFormData } from '@ycore/forge/result';
import { requireCSRFToken } from '@ycore/foundry/secure/server';

import type { SignInActionArgs, SignInLoaderArgs } from '../@types/auth.types';
import { defaultAuthRoutes } from '../auth.config';
import type { WebAuthnErrorCode } from '../auth.constants';
import type { Authenticator } from '../schema';
import { authConfigContext } from './auth.context';
import { signinFormSchema } from './auth.validation';
import { getAuthRepository } from './repository';
import { createChallengeSession, destroyChallengeSession, getChallengeFromSession } from './session';
import { generateChallenge, getWebAuthnErrorMessage, verifyAuthentication } from './webauthn';
import { createAuthenticatedSession, parseWebAuthnCredential } from './webauthn-utils';
import { validateWebAuthnRequest } from './webauthn-validation';

export async function signinLoader({ context }: SignInLoaderArgs) {
  const token = requireCSRFToken(context);
  const challenge = generateChallenge();

  const cookieResult = await createChallengeSession(context, challenge);
  if (isError(cookieResult)) {
    logger.error('signin_loader_session_creation_failed', { error: cookieResult.message });
    return respondError(cookieResult);
  }

  return respondOk({ token, challenge }, { headers: { 'Set-Cookie': cookieResult } });
}

export async function signinAction({ request, context }: SignInActionArgs) {
  const repository = getAuthRepository(context);
  const authConfig = getContext(context, authConfigContext);
  const formData = await request.formData();

  const handlers: IntentHandlers = {
    signin: async (formData: FormData) => {
      try {
        const validationResult = await validateFormData(signinFormSchema, formData);
        if (isError(validationResult)) {
          return validationResult; // User error - no logging needed
        }

        const email = validationResult.email;

        // Timing-safe user lookup - always perform the same operations; prevents user enumeration attacks
        const userResult = await repository.getUserByEmail(email);
        const userExists = !isError(userResult);
        const user = userExists ? userResult : null;

        // Get user's authenticators - empty if user doesn't exist
        const authenticatorsResult = user ? await repository.getAuthenticatorsByUserId(user.id) : ([] as any);
        const hasAuthenticators = !isError(authenticatorsResult) && authenticatorsResult.length > 0;

        // Timing-safe fail after all lookups complete
        if (!userExists || !hasAuthenticators) {
          return err('The credentials are incorrect', { email: 'The credentials are incorrect' }); // User error - no logging needed
        }

        // At this point we know authenticatorsResult is an array of Authenticator
        const authenticators = authenticatorsResult;

        // Get stored challenge from session
        const sessionResult = await getChallengeFromSession(request, context);
        if (isError(sessionResult)) {
          return sessionResult; // User error - session expired
        }

        const { challenge: storedChallenge, challengeCreatedAt, session } = sessionResult;

        // Get WebAuthn response from form
        const credentialResult = parseWebAuthnCredential(formData, 'signin');
        if (isError(credentialResult)) {
          return credentialResult;
        }

        const credential = credentialResult;

        // Verify credential ownership BEFORE signature verification
        const authenticator = authenticators.find((auth: Authenticator) => auth.id === credential.rawId);

        if (!authenticator) {
          return err('The credentials are incorrect', { email: 'The credentials are incorrect' }); // User error
        }

        // Verify the authenticator belongs to this user (defense in depth)
        if (authenticator.userId !== user?.id) {
          logger.critical('signin_authenticator_user_mismatch', {
            authenticatorUserId: authenticator.userId,
            requestUserId: user?.id,
            email,
            credentialId: credential.rawId,
          });
          return err('The credentials are incorrect', { email: 'The credentials are incorrect' });
        }

        // Validate challenge and origin using shared utility
        const webauthnValidationResult = await validateWebAuthnRequest(
          request,
          {
            storedChallenge,
            challengeCreatedAt,
            clientDataJSON: credential.response.clientDataJSON,
            operation: 'signin',
            logContext: { email },
          },
          context
        );

        if (isError(webauthnValidationResult)) {
          return webauthnValidationResult; // User error
        }

        const { challenge, origin, rpId } = webauthnValidationResult;

        // Convert base64url strings back to ArrayBuffers for verification
        const authenticationData = {
          id: credential.id,
          rawId: decodeBase64url(credential.rawId).buffer,
          response: {
            authenticatorData: decodeBase64url(credential.response.authenticatorData).buffer,
            clientDataJSON: decodeBase64url(credential.response.clientDataJSON).buffer,
            signature: decodeBase64url(credential.response.signature).buffer,
            userHandle: credential.response.userHandle ? decodeBase64url(credential.response.userHandle).buffer : undefined,
          },
          type: 'public-key' as const,
        };

        // Verify authentication using the validated challenge, origin, and rpId
        const verificationResult = await verifyAuthentication(authenticationData, challenge, origin, rpId, authenticator);

        if (isError(verificationResult)) {
          // System error - unexpected WebAuthn failure
          if (isSystemError(verificationResult)) {
            logger.error('signin_verification_system_error', { email, error: flattenError(verificationResult), code: verificationResult.code });
          }

          // Provide user-friendly error messages based on error code
          const errorMessage = getWebAuthnErrorMessage(verificationResult.code as WebAuthnErrorCode, 'authentication');
          return err(errorMessage, { field: 'general', code: verificationResult.code });
        }

        // Update authenticator counter and last used timestamp
        const updateResult = await repository.updateAuthenticatorUsage(authenticator.id, verificationResult.newCounter, new Date());

        if (isError(updateResult)) {
          logger.warning('signin_authenticator_update_failed', { authenticatorId: authenticator.id, error: updateResult.message });
          // Continue with signin even if update fails
        }

        // Handle pending operations - signin clears all dangling pending states
        if (user?.pending) {
          const pendingType = user?.pending.type;

          // Recovery mode: delete old authenticators from before recovery
          if (pendingType === 'recovery') {
            const recoveryTimestamp = user?.pending.timestamp;

            logger.info('recovery_cleanup_detected', { userId: user?.id, email, recoveryTimestamp });

            // Delete all authenticators older than recovery timestamp
            const deleteResult = await repository.deleteAuthenticatorsByTimestamp(user?.id, recoveryTimestamp);

            if (isError(deleteResult)) {
              logger.warning('recovery_cleanup_delete_failed', { userId: user?.id, email, error: flattenError(deleteResult) });
              // Continue with signin even if cleanup fails
            } else {
              logger.info('recovery_cleanup_completed', { userId: user?.id, email, deletedCount: deleteResult });
            }
          } else {
            // Email-change or account-delete: user abandoned operation, clear it
            logger.info('pending_operation_abandoned_on_signin', { userId: user?.id, email, pendingType });
          }

          // Clear pending data for all cases
          const pendingUpdateResult = await repository.updateUserPending(user?.id, null);

          if (isError(pendingUpdateResult)) {
            logger.warning('pending_clear_failed_on_signin', { userId: user?.id, email, pendingType, error: flattenError(pendingUpdateResult) });
            // Continue with signin even if pending clear fails
          }

          // If user status is not active, restore it (abandoned operations should restore status)
          if (user?.status !== 'active') {
            const statusUpdateResult = await repository.updateUserStatus(user?.id, 'active');

            if (isError(statusUpdateResult)) {
              logger.warning('status_restore_failed_on_signin', { userId: user?.id, email, error: flattenError(statusUpdateResult) });
              // Continue with signin even if status update fails
            } else {
              // Update user object so redirect logic uses correct status
              user.status = 'active';
              logger.info('status_restored_on_signin', { userId: user?.id, email });
            }
          }
        }

        // Clear challenge from session
        const cleanupResult = await destroyChallengeSession(session, context);
        if (isError(cleanupResult)) {
          // Log but continue - not critical
          logger.warning('signin_challenge_cleanup_failed', { error: flattenError(cleanupResult) });
        }

        // Create authenticated session
        const authSessionResult = await createAuthenticatedSession(context, user!, email, 'signin');
        if (isError(authSessionResult)) {
          // System error - session creation failed
          if (isSystemError(authSessionResult)) {
            logger.error('signin_session_creation_failed', { email, error: flattenError(authSessionResult) });
          }
          return authSessionResult;
        }

        // Determine redirect path based on user status
        const redirectTo = user?.status === 'active' ? authConfig?.routes.signedin || defaultAuthRoutes.signedin : authConfig?.routes.verify || defaultAuthRoutes.verify;

        // Return session cookie and redirect info
        return ok({
          sessionCookie: authSessionResult,
          redirectTo,
        });
      } catch (error) {
        if (error instanceof Response) {
          throw error;
        }

        logger.error('signin_error', { error: transformError(error) });
        return err('Authentication failed', { field: 'general' });
      }
    },
  };

  const result = await handleIntent(formData, handlers);

  if (isError(result)) {
    // System error
    if (isSystemError(result)) {
      logger.error('signin_system_error', { error: flattenError(result) });
      throwSystemError(result.message, result.status as 503);
    }

    // User error - show in form
    return respondError(result);
  }

  // Success - redirect with session cookie
  const { redirectTo, sessionCookie } = result as {
    redirectTo: string;
    sessionCookie: string;
  };

  throw respondRedirect(redirectTo, {
    headers: { 'Set-Cookie': sessionCookie },
  });
}
