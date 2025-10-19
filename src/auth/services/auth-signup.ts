import { decodeBase64url } from '@oslojs/encoding';
import type { IntentHandlers } from '@ycore/forge/intent/server';
import { handleIntent } from '@ycore/forge/intent/server';
import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, respondError, respondOk, transformError, validateFormData } from '@ycore/forge/result';
import { getKVStore } from '@ycore/forge/services';
import { getAuthConfig } from '@ycore/foundry/auth';
import { requireCSRFToken } from '@ycore/foundry/secure/services';
import { redirect } from 'react-router';

import type { SignUpActionArgs, SignUpLoaderArgs } from '../@types/auth.types';
import type { WebAuthnErrorCode } from '../auth.constants';
import { signupFormSchema } from './auth.validation';
import { getAuthRepository } from './repository';
import { createChallengeSession, destroyChallengeSession, getChallengeFromSession } from './session';
import { generateChallenge, getWebAuthnErrorMessage, verifyRegistration } from './webauthn';
import { createAuthenticatedSession, createAuthSuccessResponse, parseWebAuthnCredential } from './webauthn-utils';
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
  const authConfig = getAuthConfig(context);

  if (!authConfig) {
    return respondError(err('Auth configuration not found', { field: 'general' }));
  }

  const formData = await request.formData();

  const handlers: IntentHandlers = {
    signup: async (formData: FormData) => {
      try {
        // Validate form data
        const validationResult = await validateFormData(signupFormSchema, formData);
        if (isError(validationResult)) {
          return validationResult;
        }

        const { email, displayName } = validationResult;

        // Check if user already exists
        const existingUserResult = await repository.getUserByEmail(email);
        if (!isError(existingUserResult)) {
          return err('An account already exists with this email', { email: 'An account already exists with this email' });
        }

        // Get stored challenge from session
        const sessionResult = await getChallengeFromSession(request, context);
        if (isError(sessionResult)) {
          logger.warning('signup_invalid_session', { email, error: flattenError(sessionResult) });
          return sessionResult;
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
        const metadataKV = authConfig.webauthn.kvBinding ? getKVStore(context, authConfig.webauthn.kvBinding) : undefined;

        // Verify registration using the validated challenge, origin, and rpId
        const verificationResult = await verifyRegistration(registrationData, challenge, origin, rpId, metadataKV);

        if (isError(verificationResult)) {
          logger.error('signup_verification_failed', {
            email,
            error: verificationResult.message,
            code: verificationResult.code,
            details: verificationResult.details,
          });

          // Provide user-friendly error messages based on error code
          const errorMessage = getWebAuthnErrorMessage(verificationResult.code as WebAuthnErrorCode, 'registration');
          return err(errorMessage, { field: 'general', code: verificationResult.code });
        }

        // Create new user
        const createUserResult = await repository.createUser(email, displayName);
        if (isError(createUserResult)) {
          logger.error('signup_create_user_failed', { email, error: createUserResult.message });
          return err('Failed to create account', { field: 'general' });
        }

        const user = createUserResult;

        // Create authenticator for the user
        const createAuthResult = await repository.createAuthenticator({ ...verificationResult, userId: user.id });

        if (isError(createAuthResult)) {
          logger.error('signup_create_authenticator_failed', { email, userId: user.id, error: createAuthResult.message });
          // Attempt to clean up the created user
          await repository.deleteUser(user.id);
          return err('Failed to register authenticator', { field: 'general' });
        }

        // Clear challenge from session
        const cleanupResult = await destroyChallengeSession(session, context);
        if (isError(cleanupResult)) {
          logger.warning('signup_challenge_cleanup_failed', { error: cleanupResult.message });
          // Continue with signup even if cleanup fails
        }

        // Create authenticated session
        const authSessionResult = await createAuthenticatedSession(context, user, email, 'signup');
        if (isError(authSessionResult)) {
          return authSessionResult;
        }

        // Return success - redirect will be handled by route
        return ok(createAuthSuccessResponse(context, authSessionResult));
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
    logger.warning('signup_action_failed', { error: flattenError(result) });
    return respondError(result);
  }

  // Handle successful signup with redirect
  const successResult = result as { redirectTo: string; cookie: string };
  throw redirect(successResult.redirectTo, { headers: { 'Set-Cookie': successResult.cookie } });
}
