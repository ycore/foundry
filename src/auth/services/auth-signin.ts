import { decodeBase64url } from '@oslojs/encoding';
import type { IntentHandlers } from '@ycore/forge/intent/server';
import { handleIntent } from '@ycore/forge/intent/server';
import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, respondError, respondOk, transformError, validateFormData } from '@ycore/forge/result';
import { redirect } from 'react-router';

import { csrfContext } from '../../secure/csrf/csrf.middleware';
import type { SignInActionArgs, SignInLoaderArgs } from '../@types/auth.types';
import type { WebAuthnErrorCode } from '../auth.constants';
import { getAuthConfig } from '../auth.context';
import type { Authenticator } from '../schema';
import { signinFormSchema } from './auth.validation';
import { getAuthRepository } from './repository';
import { createChallengeSession, destroyChallengeSession, getChallengeFromSession } from './session';
import { generateChallenge, getWebAuthnErrorMessage, verifyAuthentication } from './webauthn';
import { createAuthenticatedSession, createAuthSuccessResponse, parseWebAuthnCredential } from './webauthn-utils';
import { validateWebAuthnRequest } from './webauthn-validation';

export async function signinLoader({ context }: SignInLoaderArgs) {
  const csrfData = context.get(csrfContext);
  const challenge = generateChallenge();

  const cookieResult = await createChallengeSession(context, challenge);
  if (isError(cookieResult)) {
    logger.error('signin_loader_session_creation_failed', { error: cookieResult.message });
    return respondError(cookieResult);
  }

  return respondOk({ csrfData, challenge }, { headers: { 'Set-Cookie': cookieResult } });
}

export async function signinAction({ request, context }: SignInActionArgs) {
  const repository = getAuthRepository(context);
  const authConfig = getAuthConfig(context);

  if (!authConfig) {
    logger.warning('signin_action_no_config');
    return respondError(err('Auth configuration not found', { field: 'general' }));
  }

  const formData = await request.formData();

  const handlers: IntentHandlers = {
    signin: async (formData: FormData) => {
      try {
        const validationResult = await validateFormData(signinFormSchema, formData);
        if (isError(validationResult)) {
          logger.warning('signin_validation_failed', { error: flattenError(validationResult) });
          return validationResult;
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
          logger.warning('signin_invalid_credentials', { email });
          return err('The credentials are incorrect', { email: 'The credentials are incorrect' });
        }

        // At this point we know authenticatorsResult is an array of Authenticator
        const authenticators = authenticatorsResult;

        // Get stored challenge from session
        const sessionResult = await getChallengeFromSession(request, context);
        if (isError(sessionResult)) {
          logger.warning('signin_invalid_session', { email, error: flattenError(sessionResult) });
          return sessionResult;
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
          logger.warning('signin_authenticator_not_found', { email, credentialId: credential.rawId });
          return err('The credentials are incorrect', { email: 'The credentials are incorrect' });
        }

        // Verify the authenticator belongs to this user (defense in depth)
        if (authenticator.userId !== user!.id) {
          logger.critical('signin_authenticator_user_mismatch', {
            authenticatorUserId: authenticator.userId,
            requestUserId: user!.id,
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
          logger.warning('signin_webauthn_validation_failed', { email, error: flattenError(webauthnValidationResult) });
          return webauthnValidationResult;
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
          logger.error('signin_verification_failed', {
            email,
            error: verificationResult.message,
            code: verificationResult.code,
            details: verificationResult.details,
          });

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

        // Clear challenge from session
        const cleanupResult = await destroyChallengeSession(session, context);
        if (isError(cleanupResult)) {
          logger.warning('signin_challenge_cleanup_failed', { error: cleanupResult.message });
          // Continue with signin even if cleanup fails
        }

        // Create authenticated session
        const authSessionResult = await createAuthenticatedSession(context, user!, email, 'signin');
        if (isError(authSessionResult)) {
          return authSessionResult;
        }

        // Return success - redirect will be handled by route
        return ok(createAuthSuccessResponse(context, authSessionResult));
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
    logger.warning('signin_action_failed', { error: flattenError(result) });
    return respondError(result);
  }

  // Handle successful signin with redirect
  const successData = result as { redirectTo: string; cookie: string };
  throw redirect(successData.redirectTo, { headers: { 'Set-Cookie': successData.cookie } });
}
