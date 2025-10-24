import { decodeBase64url } from '@oslojs/encoding';
import { getContext } from '@ycore/forge/context';
import type { IntentHandlers } from '@ycore/forge/intent/server';
import { handleIntent } from '@ycore/forge/intent/server';
import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, isSystemError, ok, respondError, respondOk, respondRedirect, throwSystemError, transformError, validateFormData } from '@ycore/forge/result';
import { getKVStore } from '@ycore/forge/services';
import { requireCSRFToken } from '@ycore/foundry/secure/server';

import type { SignUpActionArgs, SignUpLoaderArgs } from '../@types/auth.types';
import { defaultAuthRoutes } from '../auth.config';
import type { WebAuthnErrorCode } from '../auth.constants';
import type { User } from '../schema';
import { authConfigContext } from './auth.context';
import { signupFormSchema } from './auth.validation';
import { getAuthRepository } from './repository';
import { createChallengeSession, destroyChallengeSession, getChallengeFromSession } from './session';
import { sendVerificationEmail } from './verification-service';
import { generateChallenge, getWebAuthnErrorMessage, verifyRegistration } from './webauthn';
import { createAuthenticatedSession, parseWebAuthnCredential } from './webauthn-utils';
import { validateWebAuthnRequest } from './webauthn-validation';

export async function signupLoader({ context }: SignUpLoaderArgs) {
  const token = requireCSRFToken(context);
  const challenge = generateChallenge();

  const cookieResult = await createChallengeSession(context, challenge);
  if (isError(cookieResult)) {
    logger.error('signup_loader_session_creation_failed', { error: cookieResult.message });
    return respondError(cookieResult);
  }

  return respondOk({ token, challenge }, { headers: { 'Set-Cookie': cookieResult } });
}

export async function signupAction({ request, context }: SignUpActionArgs) {
  const repository = getAuthRepository(context);
  const authConfig = getContext(context, authConfigContext);
  const formData = await request.formData();

  const handlers: IntentHandlers = {
    signup: async (formData: FormData) => {
      try {
        // Validate form data
        const validationResult = await validateFormData(signupFormSchema, formData);
        if (isError(validationResult)) {
          return validationResult; // User error - no logging needed
        }

        const { email, displayName } = validationResult;

        // Check if user already exists
        const existingUserResult = await repository.getUserByEmail(email);

        // Allow recovery mode if user exists with status='unrecovered'
        const isRecoveryMode = !isError(existingUserResult) && existingUserResult.status === 'unrecovered';

        if (!isError(existingUserResult) && !isRecoveryMode) {
          return err('An account already exists with this email', { email: 'An account already exists with this email' });
        }

        logger.info('signup_mode_detected', { email, isRecoveryMode });

        // Get stored challenge from session
        const sessionResult = await getChallengeFromSession(request, context);
        if (isError(sessionResult)) {
          return sessionResult; // User error - session expired
        }

        const { challenge: storedChallenge, challengeCreatedAt, session } = sessionResult;

        // Get WebAuthn response from form
        const credentialResult = parseWebAuthnCredential(formData, 'signup');
        if (isError(credentialResult)) {
          return credentialResult;
        }

        const credential = credentialResult;

        // Validate challenge and origin using shared utility
        const webauthnValidationResult = await validateWebAuthnRequest(
          request,
          {
            storedChallenge,
            challengeCreatedAt,
            clientDataJSON: credential.response.clientDataJSON,
            operation: 'signup',
            logContext: { email },
          },
          context
        );

        if (isError(webauthnValidationResult)) {
          return webauthnValidationResult;
        }

        const { challenge, origin, rpId } = webauthnValidationResult;

        // Convert base64url strings back to ArrayBuffers for verification
        const registrationData = {
          id: credential.id,
          rawId: decodeBase64url(credential.rawId).buffer,
          response: {
            attestationObject: decodeBase64url(credential.response.attestationObject).buffer,
            clientDataJSON: decodeBase64url(credential.response.clientDataJSON).buffer,
            transports: credential.response?.transports || [],
          },
          type: 'public-key' as const,
          authenticatorAttachment: credential.authenticatorAttachment || null,
        };

        // Get metadata KV from config (follows CSRF pattern)
        const metadataKV = authConfig?.webauthn.kvBinding ? getKVStore(context, authConfig.webauthn.kvBinding) : undefined;

        // Verify registration using the validated challenge, origin, and rpId
        const verificationResult = await verifyRegistration(registrationData, challenge, origin, rpId, metadataKV);

        if (isError(verificationResult)) {
          // System error - unexpected WebAuthn failure
          if (isSystemError(verificationResult)) {
            logger.error('signup_verification_system_error', { email, error: flattenError(verificationResult), code: verificationResult.code });
          }

          // Provide user-friendly error messages based on error code
          const errorMessage = getWebAuthnErrorMessage(verificationResult.code as WebAuthnErrorCode, 'registration');
          return err(errorMessage, { field: 'general', code: verificationResult.code });
        }

        // Get or create user based on mode
        let user: User;
        if (isRecoveryMode) {
          // Use existing user for recovery
          user = existingUserResult;
          logger.info('recovery_mode_using_existing_user', { userId: user.id, email });
        } else {
          // Create new user for normal signup
          const createUserResult = await repository.createUser(email, displayName);
          if (isError(createUserResult)) {
            // System error - database failure
            logger.error('signup_create_user_failed', { email, error: flattenError(createUserResult) });
            return err('Failed to create account', { field: 'general' }, { status: 503 });
          }
          user = createUserResult;
        }

        // Create authenticator for the user
        const createAuthResult = await repository.createAuthenticator({ ...verificationResult, userId: user.id });

        if (isError(createAuthResult)) {
          // System error - database failure
          logger.error('signup_create_authenticator_failed', { email, userId: user.id, error: flattenError(createAuthResult) });
          // Attempt cleanup only if we created a new user
          if (!isRecoveryMode) {
            await repository.deleteUser(user.id);
          }
          return err('Failed to register authenticator', { field: 'general' }, { status: 503 });
        }

        // Handle recovery mode: set pending recovery timestamp and update status
        if (isRecoveryMode) {
          const recoveryTimestamp = Date.now();

          // Store recovery timestamp for cleanup
          const pendingUpdateResult = await repository.updateUserPending(user.id, {
            type: 'recovery',
            timestamp: recoveryTimestamp,
          });

          if (isError(pendingUpdateResult)) {
            logger.error('recovery_pending_update_failed', { userId: user.id, error: flattenError(pendingUpdateResult) });
            // Continue anyway - passkey is registered, we'll just miss cleanup
          }

          // Update user status to active
          const statusUpdateResult = await repository.updateUserStatus(user.id, 'active');

          if (isError(statusUpdateResult)) {
            logger.error('recovery_status_update_failed', { userId: user.id, error: flattenError(statusUpdateResult) });
            // Continue anyway - user can still sign in
          }

          logger.info('recovery_passkey_registered', { userId: user.id, email, recoveryTimestamp });
        }

        // Clear challenge from session
        const cleanupResult = await destroyChallengeSession(session, context);
        if (isError(cleanupResult)) {
          // Log but continue - not critical
          logger.warning('signup_challenge_cleanup_failed', { error: flattenError(cleanupResult) });
        }

        // Create authenticated session
        const authSessionResult = await createAuthenticatedSession(context, user, email, 'signup');
        if (isError(authSessionResult)) {
          // System error - session creation failed
          if (isSystemError(authSessionResult)) {
            logger.error('signup_session_creation_failed', { email, error: flattenError(authSessionResult) });
          }
          return authSessionResult;
        }

        if (user.status !== 'active') {
          const verificationResult = await sendVerificationEmail({ email, purpose: 'signup', context });

          if (isError(verificationResult)) {
            logger.warning('signup_verification_email_error', { email, error: flattenError(verificationResult) });
          }
        }

        // Determine redirect path based on user status
        const redirectTo = user.status === 'active' ? authConfig?.routes.signedin || defaultAuthRoutes.signedin : authConfig?.routes.verify || defaultAuthRoutes.verify;

        // Return session cookie and redirect info
        return ok({ sessionCookie: authSessionResult, redirectTo });
      } catch (error) {
        if (error instanceof Response) {
          throw error;
        }

        logger.error('signup_error', { error: transformError(error) });
        return err('Registration failed', { field: 'general' });
      }
    },
  };

  const result = await handleIntent(formData, handlers);

  if (isError(result)) {
    // System error
    if (isSystemError(result)) {
      logger.error('signup_system_error', { error: flattenError(result) });
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
