import { decodeBase64url } from '@oslojs/encoding';
import { logger } from '@ycore/forge/logger';
import { err, isError, respondError, respondOk, validateFormData } from '@ycore/forge/result';
import { redirect } from 'react-router';

import { csrfContext } from '../../secure/csrf/csrf.middleware';
import type { SignInActionArgs, SignInLoaderArgs } from '../@types/auth.types';
import { WebAuthnErrorCode } from '../@types/auth.types';
import { defaultAuthConfig, defaultAuthRoutes } from '../auth.config';
import { getAuthConfig } from '../auth-config.context';
import { getAuthRepository } from './auth-factory';
import { signinFormSchema } from './auth-validation';
import { createAuthSession, createAuthSessionStorage, verifyChallengeUniqueness } from './session';
import { generateChallenge, getWebAuthnErrorMessage, verifyAuthentication } from './webauthn';

export async function signinLoader({ context }: SignInLoaderArgs) {
  const csrfData = context.get(csrfContext);

  // Generate challenge for WebAuthn
  const challenge = generateChallenge();

  // Store challenge in session for verification
  const sessionStorage = createAuthSessionStorage(context);
  const session = await sessionStorage.getSession();
  session.set('challenge', challenge);
  session.set('challengeCreatedAt', Date.now());

  const cookie = await sessionStorage.commitSession(session);

  return respondOk(
    {
      csrfToken: csrfData?.token,
      challenge,
    },
    { headers: { 'Set-Cookie': cookie } }
  );
}

export async function signinAction({ request, context }: SignInActionArgs) {
  const repository = getAuthRepository(context);
  const authConfig = getAuthConfig(context);

  if (!authConfig) {
    return respondError(err('Auth configuration not found', { field: 'general' }));
  }

  const formData = await request.formData();
  const intent = formData.get('intent')?.toString();

  if (intent !== 'signin') {
    return respondError(err('Invalid intent', { field: 'general' }));
  }

  try {
    // Validate form data
    const validationResult = await validateFormData(signinFormSchema, formData);
    if (isError(validationResult)) {
      return respondError(validationResult);
    }

    const email = validationResult.email;

    // Check if user exists
    const userResult = await repository.getUserByEmail(email);
    if (isError(userResult)) {
      return respondError(err('Invalid credentials', { email: 'Invalid credentials' }));
    }

    const user = userResult;

    // Get user's authenticators
    const authenticatorsResult = await repository.getAuthenticatorsByUserId(user.id);
    if (isError(authenticatorsResult) || authenticatorsResult.length === 0) {
      return respondError(err('No authenticators found. Please sign up first.', { field: 'general' }));
    }

    // Get stored challenge from session
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get('Cookie'));
    const storedChallenge = session.get('challenge');
    const challengeCreatedAt = session.get('challengeCreatedAt');

    if (!storedChallenge || !challengeCreatedAt) {
      return respondError(err('Invalid session. Please refresh and try again.', { field: 'general' }));
    }

    // Check challenge expiration (5 minutes)
    const challengeMaxAge = 5 * 60 * 1000;
    if (Date.now() - challengeCreatedAt > challengeMaxAge) {
      return respondError(
        err('Session expired. Please refresh and try again.', {
          field: 'general',
          code: WebAuthnErrorCode.CHALLENGE_EXPIRED,
        })
      );
    }

    // Verify challenge uniqueness
    const uniquenessResult = await verifyChallengeUniqueness(storedChallenge, context);
    if (isError(uniquenessResult)) {
      return respondError(
        err('Invalid challenge. Please refresh and try again.', {
          field: 'general',
          code: WebAuthnErrorCode.INVALID_CHALLENGE,
        })
      );
    }

    // Get WebAuthn response from form
    const webauthnResponse = formData.get('webauthn_response')?.toString();
    if (!webauthnResponse) {
      return respondError(err('Authentication failed. Please try again.', { field: 'general' }));
    }

    const credential: any = JSON.parse(webauthnResponse);

    // Find matching authenticator - use rawId which is base64url encoded like what we stored
    const authenticator = authenticatorsResult.find(auth => auth.id === credential.rawId);
    if (!authenticator) {
      return respondError(err('Invalid authenticator', { field: 'general' }));
    }

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

    // Resolve WebAuthn configuration values
    const webauthnConfig = authConfig?.webauthn || defaultAuthConfig.webauthn;
    const resolvedRpID = typeof webauthnConfig.rpID === 'function' ? await webauthnConfig.rpID(request) : webauthnConfig.rpID;
    const resolvedOrigins = typeof webauthnConfig.origin === 'function' ? await webauthnConfig.origin(request) : webauthnConfig.origin;

    // Get the client origin from the clientDataJSON (this is what the browser sent)
    const clientData = JSON.parse(new TextDecoder().decode(decodeBase64url(credential.response.clientDataJSON)));
    const clientOrigin = clientData.origin;

    // Check if the client origin is in our allowed origins
    const allowedOrigins = Array.isArray(resolvedOrigins) ? resolvedOrigins : [resolvedOrigins];

    if (!allowedOrigins.includes(clientOrigin)) {
      return respondError(err('Origin not allowed', { field: 'general' }));
    }

    // Verify authentication using the client origin
    const verificationResult = await verifyAuthentication(authenticationData, storedChallenge, clientOrigin, resolvedRpID, authenticator);

    if (isError(verificationResult)) {
      logger.error('signin_verification_failed', {
        error: verificationResult.message,
        code: verificationResult.code,
        details: verificationResult.details,
      });

      // Provide user-friendly error messages based on error code
      const errorMessage = getWebAuthnErrorMessage(verificationResult.code as WebAuthnErrorCode, 'authentication');
      return respondError(
        err(errorMessage, {
          field: 'general',
          code: verificationResult.code,
        })
      );
    }

    // Update authenticator counter
    if (verificationResult.newCounter !== authenticator.counter) {
      await repository.updateAuthenticatorCounter(authenticator.id, verificationResult.newCounter);
    }

    // Clear challenge from session
    await sessionStorage.destroySession(session);

    // Create authenticated session
    const sessionResult = await createAuthSession(context, { user });
    if (isError(sessionResult)) {
      logger.error('signin_session_creation_failed', { error: sessionResult.message });
      return respondError(err('Failed to create session', { field: 'general' }));
    }

    logger.info('signin_success', { userId: user.id, email: user.email });

    const redirectTo = authConfig?.routes.signedin || defaultAuthRoutes.signedin;
    throw redirect(redirectTo, { headers: { 'Set-Cookie': sessionResult } });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    logger.error('signin_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return respondError(err('Authentication failed', { field: 'general' }));
  }
}
