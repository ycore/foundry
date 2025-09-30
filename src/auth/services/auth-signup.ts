import { decodeBase64url } from '@oslojs/encoding';
import { logger } from '@ycore/forge/logger';
import { err, isError, respondError, respondOk, validateFormData } from '@ycore/forge/result';
import { redirect } from 'react-router';

import { csrfContext } from '../../secure/csrf/csrf.middleware';
import type { SignUpActionArgs, SignUpLoaderArgs } from '../@types/auth.types';
import { defaultAuthConfig, defaultAuthRoutes } from '../auth.config';
import { WebAuthnErrorCode } from '../auth.constants';
import { getAuthConfig } from '../auth-config.context';
import { getAuthRepository } from './auth-factory';
import { signupFormSchema } from './auth-validation';
import { createAuthSession, createAuthSessionStorage, verifyChallengeUniqueness } from './session';
import { generateChallenge, getWebAuthnErrorMessage, verifyRegistration } from './webauthn';

export async function signupLoader({ context }: SignUpLoaderArgs) {
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

export async function signupAction({ request, context }: SignUpActionArgs) {
  const repository = getAuthRepository(context);
  const authConfig = getAuthConfig(context);

  if (!authConfig) {
    return respondError(err('Auth configuration not found', { field: 'general' }));
  }

  const formData = await request.formData();
  const intent = formData.get('intent')?.toString();

  if (intent !== 'signup') {
    return respondError(err('Invalid intent', { field: 'general' }));
  }

  try {
    // Validate form data
    const validationResult = await validateFormData(signupFormSchema, formData);
    if (isError(validationResult)) {
      return respondError(validationResult);
    }

    const { email, displayName } = validationResult;

    // Check if user already exists
    const existingUserResult = await repository.getUserByEmail(email);
    if (!isError(existingUserResult)) {
      return respondError(err('An account already exists with this email', { email: 'An account already exists with this email' }));
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
      return respondError(err('Registration failed. Please try again.', { field: 'general' }));
    }

    const credential: any = JSON.parse(webauthnResponse);

    // Convert base64url strings back to ArrayBuffers for verification
    const registrationData = {
      id: credential.id,
      rawId: decodeBase64url(credential.rawId).buffer,
      response: {
        attestationObject: decodeBase64url(credential.response.attestationObject).buffer,
        clientDataJSON: decodeBase64url(credential.response.clientDataJSON).buffer,
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

    // Verify registration using the client origin
    const verificationResult = await verifyRegistration(registrationData, storedChallenge, clientOrigin, resolvedRpID);

    if (isError(verificationResult)) {
      logger.error('signup_verification_failed', {
        error: verificationResult.message,
        code: verificationResult.code,
        details: verificationResult.details,
      });

      // Provide user-friendly error messages based on error code
      const errorMessage = getWebAuthnErrorMessage(verificationResult.code as WebAuthnErrorCode, 'registration');
      return respondError(
        err(errorMessage, {
          field: 'general',
          code: verificationResult.code,
        })
      );
    }

    // Create new user
    const createUserResult = await repository.createUser(email, displayName);
    if (isError(createUserResult)) {
      logger.error('signup_create_user_failed', { error: createUserResult.message });
      return respondError(err('Failed to create account', { field: 'general' }));
    }

    const user = createUserResult;

    // Create authenticator for the user
    const createAuthResult = await repository.createAuthenticator({
      ...verificationResult,
      userId: user.id,
    });

    if (isError(createAuthResult)) {
      logger.error('signup_create_authenticator_failed', { error: createAuthResult.message });
      // Attempt to clean up the created user
      await repository.deleteUser(user.id);
      return respondError(err('Failed to register authenticator', { field: 'general' }));
    }

    // Clear challenge from session
    await sessionStorage.destroySession(session);

    // Create authenticated session
    const sessionResult = await createAuthSession(context, { user });
    if (isError(sessionResult)) {
      logger.error('signup_session_creation_failed', { error: sessionResult.message });
      return respondError(err('Failed to create session', { field: 'general' }));
    }

    logger.info('signup_success', { userId: user.id, email: user.email });

    const redirectTo = authConfig?.routes.signedin || defaultAuthRoutes.signedin;
    throw redirect(redirectTo, { headers: { 'Set-Cookie': sessionResult } });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    logger.error('signup_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return respondError(err('Registration failed', { field: 'general' }));
  }
}
