import { logger } from '@ycore/forge/logger';
import { err, isError, respondError, respondOk, validateFormData } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';
import { redirect } from 'react-router';
import { csrfContext } from '../../secure';
import { signinFormSchema } from '../validation/auth-schemas';
import { createAuthenticator } from './auth-factory';
import { createAuthSession, createAuthSessionStorage } from './session';

export interface SignInLoaderArgs {
  context: Readonly<RouterContextProvider>;
}

export interface SignInActionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

export async function signinLoader({ context }: SignInLoaderArgs) {
  const csrfData = context.get(csrfContext);
  return respondOk({ csrfToken: csrfData?.token });
}

export async function signinAction({ request, context }: SignInActionArgs) {
  const { authenticator, webAuthnStrategy, repository } = createAuthenticator(context);

  // Clone request before reading formData to preserve stream for authenticator
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();

  try {
    const username = formData.get('username')?.toString();
    const intent = formData.get('intent')?.toString();

    // Handle username check with validation
    if (intent === 'check-username' && username) {
      // Validate username input
      const validationResult = await validateFormData(signinFormSchema, formData);
      if (isError(validationResult)) {
        return respondError(validationResult);
      }

      // Check if user exists in database
      const userResult = await repository.getUserByUsername(username);
      if (isError(userResult)) {
        const supportId = logger.support();
        return respondError(
          {
            message: 'Please check credentials or sign up for a new account.',
            details: {
              username: 'Please check credentials or sign up for a new account.',
              support: supportId,
            },
          },
          undefined,
          () => logger.error(`Please check credentials or sign up for a new account. ${supportId}`)
        );
      }

      // User exists, generate options and create session with challenge
      const options = await webAuthnStrategy.generateOptions(request, userResult);

      // SECURITY: Create a new session for challenge to prevent session fixation
      const sessionStorage = createAuthSessionStorage(context);
      const session = await sessionStorage.getSession();

      session.set('challenge', options.challenge);
      session.set('username', username);
      session.set('challengeCreatedAt', Date.now());

      const cookie = await sessionStorage.commitSession(session);

      return respondOk({ options, username, userExists: true, ready: true }, { headers: { 'Set-Cookie': cookie } });
    }

    // Handle authentication using original request
    const user = await authenticator.authenticate('webauthn', request);

    // Clear the challenge session to prevent reuse (replay attack prevention)
    const sessionStorage = createAuthSessionStorage(context);
    const challengeSession = await sessionStorage.getSession(request.headers.get('Cookie'));

    // Verify challenge was present and not expired
    const storedChallenge = challengeSession.get('challenge');
    const challengeCreatedAt = challengeSession.get('challengeCreatedAt');
    const challengeMaxAge = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (!storedChallenge) {
      return respondError(err('Invalid authentication session. Please try again.', { field: 'general' }));
    }

    // Check if challenge has expired
    if (!challengeCreatedAt || Date.now() - challengeCreatedAt > challengeMaxAge) {
      await sessionStorage.destroySession(challengeSession);
      return respondError(err('Authentication session expired. Please try again.', { field: 'general' }));
    }

    // Destroy the challenge session to prevent reuse
    await sessionStorage.destroySession(challengeSession);

    // Create new session with user (this will replace the challenge session)
    const sessionResult = await createAuthSession(context, { user });

    if (isError(sessionResult)) {
      return respondError(err('Failed to create session', { field: 'general' }), undefined, () => logger.error('Session creation failed:', sessionResult.message));
    }

    // Get route config from context or use default
    const routeConfig = context.get('routeConfig' as any) || { auth: { signedin: '/foundry/auth/profile' } };

    throw redirect(routeConfig.auth.signedin, { headers: { 'Set-Cookie': sessionResult } });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    // Clean up challenge session on authentication failure to prevent session leakage
    try {
      const sessionStorage = createAuthSessionStorage(context);
      const challengeSession = await sessionStorage.getSession(request.headers.get('Cookie'));
      if (challengeSession.get('challenge')) {
        await sessionStorage.destroySession(challengeSession);
      }
    } catch (cleanupError) {
      logger.warning('Failed to cleanup challenge session after authentication error', {
        cleanupError: cleanupError instanceof Error ? cleanupError.message : 'unknown',
      });
    }

    if (error instanceof Error) {
      return respondError(err(error.message, { field: 'general' }), undefined, () => logger.error('Authentication error:', error.message));
    }
    return respondError(err('Authentication failed', { field: 'general' }));
  }
}
