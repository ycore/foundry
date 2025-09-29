import { decodeBase64url } from '@oslojs/encoding';
import { logger } from '@ycore/forge/logger';
import { err, isError, respondError, respondOk, validateFormData } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';
import { redirect } from 'react-router';
import { csrfContext } from '../../secure';
import { getAuthConfig } from '../auth-config.context';
import { signupFormSchema } from '../validation/auth-schemas';
import { getAuthRepository } from './auth-factory';
import { createAuthSession, createAuthSessionStorage } from './session';
import { createRegistrationOptions, generateChallenge, verifyRegistration } from './webauthn-oslo';

export interface SignUpLoaderArgs {
  context: Readonly<RouterContextProvider>;
}

export interface SignUpActionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

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

  // Debug logging
  logger.debug('signup_form_data', {
    intent,
    email: formData.get('email'),
    displayName: formData.get('displayName'),
    hasWebauthnResponse: !!formData.get('webauthn_response'),
  });

  if (intent !== 'signup') {
    logger.warning('signup_invalid_intent', { intent });
    return respondError(err('Invalid intent', { field: 'general' }));
  }

  try {
    // Validate form data
    const validationResult = await validateFormData(signupFormSchema, formData);
    if (isError(validationResult)) {
      logger.warning('signup_validation_failed', { error: validationResult });
      return respondError(validationResult);
    }

    const { email, displayName } = validationResult;

    // Check if user already exists
    const existingUserResult = await repository.getUserByEmail(email);
    if (!isError(existingUserResult)) {
      logger.warning('signup_user_exists', { email });
      return respondError(err('An account already exists with this email', { email: 'An account already exists with this email' }));
    }

    // Get stored challenge from session
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get('Cookie'));
    const storedChallenge = session.get('challenge');
    const challengeCreatedAt = session.get('challengeCreatedAt');

    if (!storedChallenge || !challengeCreatedAt) {
      logger.warning('signup_no_challenge');
      return respondError(err('Invalid session. Please refresh and try again.', { field: 'general' }));
    }

    // Check challenge expiration (5 minutes)
    const challengeMaxAge = 5 * 60 * 1000;
    if (Date.now() - challengeCreatedAt > challengeMaxAge) {
      logger.warning('signup_challenge_expired');
      return respondError(err('Session expired. Please refresh and try again.', { field: 'general' }));
    }

    // Get WebAuthn response from form
    const webauthnResponse = formData.get('webauthn_response')?.toString();
    if (!webauthnResponse) {
      logger.warning('signup_no_webauthn_response');
      return respondError(err('Registration failed. Please try again.', { field: 'general' }));
    }

    const credential: any = JSON.parse(webauthnResponse);

    // Convert base64url strings back to ArrayBuffers for verification
    const registrationData = {
      id: credential.id,
      rawId: decodeBase64url(credential.rawId),
      response: {
        attestationObject: decodeBase64url(credential.response.attestationObject),
        clientDataJSON: decodeBase64url(credential.response.clientDataJSON),
      },
      type: 'public-key' as const,
    };

    // Resolve WebAuthn configuration values
    const resolvedRpID = typeof authConfig.webauthn.rpID === 'function' 
      ? await authConfig.webauthn.rpID(request)
      : authConfig.webauthn.rpID;
    
    const resolvedOrigins = typeof authConfig.webauthn.origin === 'function'
      ? await authConfig.webauthn.origin(request)
      : authConfig.webauthn.origin;
    
    // Get the client origin from the clientDataJSON (this is what the browser sent)
    const clientData = JSON.parse(new TextDecoder().decode(decodeBase64url(credential.response.clientDataJSON)));
    const clientOrigin = clientData.origin;
    
    // Check if the client origin is in our allowed origins
    const allowedOrigins = Array.isArray(resolvedOrigins) ? resolvedOrigins : [resolvedOrigins];
    
    if (!allowedOrigins.includes(clientOrigin)) {
      logger.warning('signup_origin_not_allowed', { 
        clientOrigin, 
        allowedOrigins 
      });
      return respondError(err('Origin not allowed', { field: 'general' }));
    }

    // Verify registration using the client origin
    const verificationResult = await verifyRegistration(registrationData, storedChallenge, clientOrigin, resolvedRpID);

    if (isError(verificationResult)) {
      logger.error('signup_verification_failed', { error: verificationResult.message });
      return respondError(err('Registration failed', { field: 'general' }));
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

    // Get redirect URL from route config
    const routeConfig = context.get('routeConfig' as any) || { auth: { signedin: '/foundry/auth/profile' } };

    logger.info('signup_success', { userId: user.id, email: user.email });

    throw redirect(routeConfig.auth.signedin, { headers: { 'Set-Cookie': sessionResult } });
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
