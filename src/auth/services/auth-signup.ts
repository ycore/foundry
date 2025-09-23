import { logger } from '@ycore/forge/logger';
import { err, isError, respondError, respondOk, validateFormData } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';
import { redirect } from 'react-router';
import { csrfContext } from '../../secure';
import { signupFormSchema } from '../validation/auth-schemas';
import { createAuthenticator } from './auth-factory';
import { cleanupChallengeSession, createAuthSession, createChallengeOnlySession } from './session';

export interface SignUpLoaderArgs {
  context: Readonly<RouterContextProvider>;
}

export interface SignUpActionArgs {
  request: Request;
  context: Readonly<RouterContextProvider>;
}

export async function signupLoader({ context }: SignUpLoaderArgs) {
  const csrfData = context.get(csrfContext);
  return respondOk({ csrfToken: csrfData?.token });
}

export async function signupAction({ request, context }: SignUpActionArgs) {
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
      const validationResult = await validateFormData(signupFormSchema, formData);
      if (isError(validationResult)) {
        return respondError(validationResult);
      }

      // Check if user already exists in database
      const userResult = await repository.getUserByUsername(username);
      if (!isError(userResult)) {
        return respondError(err('Please check credentials or sign in instead.', { username: 'Please check credentials or sign in instead.' }));
      }

      // Username is available, generate options and create session with challenge
      const options = await webAuthnStrategy.generateOptions(request, null);

      // Create challenge session with deterministic key
      const challengeResult = await createChallengeOnlySession(username, options.challenge, context);

      if (isError(challengeResult)) {
        return respondError(err('Failed to prepare registration. Please try again.', { field: 'general' }), undefined, () => logger.error('Failed to create challenge session:', challengeResult.message));
      }

      return respondOk({ options, username, userExists: false, ready: true }, { headers: { 'Set-Cookie': challengeResult } });
    }

    // Handle registration using original request
    const user = await authenticator.authenticate('webauthn', request);

    // Clean up challenge session after successful auth
    if (username) {
      await cleanupChallengeSession(username, context);
    }

    // Create new session with user
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

    // Clean up challenge session on registration failure to prevent session leakage
    try {
      const username = formData.get('username')?.toString();
      if (username) {
        await cleanupChallengeSession(username, context);
      }
    } catch (cleanupError) {
      logger.warning('Failed to cleanup challenge session after registration error', {
        cleanupError: cleanupError instanceof Error ? cleanupError.message : 'unknown',
      });
    }

    if (error instanceof Error) {
      return respondError(err(error.message, { field: 'general' }), undefined, () => logger.error('Registration error:', error.message));
    }
    return respondError(err('Registration failed', { field: 'general' }));
  }
}
