import { decodeBase64url } from '@oslojs/encoding';
import { logger } from '@ycore/forge/logger';
import { err, isError, respondError, respondOk, validateFormData } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';
import { redirect } from 'react-router';
import { csrfContext } from '../../secure';
import { getAuthConfig } from '../auth-config.context';
import { signinFormSchema } from '../validation/auth-schemas';
import { getAuthRepository } from './auth-factory';
import { createAuthSession, createAuthSessionStorage } from './session';
import { createAuthenticationOptions, generateChallenge, verifyAuthentication } from './webauthn-oslo';

export interface SignInLoaderArgs {
  context: Readonly<RouterContextProvider>;
}

export interface SignInActionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

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
      logger.warning('signin_user_not_found', { email });
      return respondError(err('Invalid credentials', { email: 'Invalid credentials' }));
    }

    const user = userResult;

    // Get user's authenticators
    const authenticatorsResult = await repository.getAuthenticatorsByUserId(user.id);
    if (isError(authenticatorsResult) || authenticatorsResult.length === 0) {
      logger.warning('signin_no_authenticators', { userId: user.id });
      return respondError(err('No authenticators found. Please sign up first.', { field: 'general' }));
    }

    // Get stored challenge from session
    const sessionStorage = createAuthSessionStorage(context);
    const session = await sessionStorage.getSession(request.headers.get('Cookie'));
    const storedChallenge = session.get('challenge');
    const challengeCreatedAt = session.get('challengeCreatedAt');

    if (!storedChallenge || !challengeCreatedAt) {
      logger.warning('signin_no_challenge');
      return respondError(err('Invalid session. Please refresh and try again.', { field: 'general' }));
    }

    // Check challenge expiration (5 minutes)
    const challengeMaxAge = 5 * 60 * 1000;
    if (Date.now() - challengeCreatedAt > challengeMaxAge) {
      logger.warning('signin_challenge_expired');
      return respondError(err('Session expired. Please refresh and try again.', { field: 'general' }));
    }

    // Get WebAuthn response from form
    const webauthnResponse = formData.get('webauthn_response')?.toString();
    if (!webauthnResponse) {
      logger.warning('signin_no_webauthn_response');
      return respondError(err('Authentication failed. Please try again.', { field: 'general' }));
    }

    const credential: any = JSON.parse(webauthnResponse);

    // Find matching authenticator - use rawId which is base64url encoded like what we stored
    const authenticator = authenticatorsResult.find(auth => auth.id === credential.rawId);
    if (!authenticator) {
      logger.warning('signin_authenticator_not_found', { credentialId: credential.rawId, availableIds: authenticatorsResult.map(a => a.id) });
      return respondError(err('Invalid authenticator', { field: 'general' }));
    }

    // Convert base64url strings back to ArrayBuffers for verification
    const authenticationData = {
      id: credential.id,
      rawId: decodeBase64url(credential.rawId),
      response: {
        authenticatorData: decodeBase64url(credential.response.authenticatorData),
        clientDataJSON: decodeBase64url(credential.response.clientDataJSON),
        signature: decodeBase64url(credential.response.signature),
        userHandle: credential.response.userHandle ? decodeBase64url(credential.response.userHandle) : undefined,
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
      logger.warning('signin_origin_not_allowed', { 
        clientOrigin, 
        allowedOrigins 
      });
      return respondError(err('Origin not allowed', { field: 'general' }));
    }

    // Verify authentication using the client origin
    const verificationResult = await verifyAuthentication(authenticationData, storedChallenge, clientOrigin, resolvedRpID, authenticator);

    if (isError(verificationResult)) {
      logger.error('signin_verification_failed', { error: verificationResult.message });
      return respondError(err('Authentication failed', { field: 'general' }));
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

    // Get redirect URL from route config
    const routeConfig = context.get('routeConfig' as any) || { auth: { signedin: '/foundry/auth/profile' } };

    logger.info('signin_success', { userId: user.id, email: user.email });

    throw redirect(routeConfig.auth.signedin, { headers: { 'Set-Cookie': sessionResult } });
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
