import type { Result } from '@ycore/forge/result';
import { isError, ok } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';

import type { Authenticator, User } from '../schema';
import { requireAuthUser } from './auth.context';
import { getAuthRepository } from './repository';

export interface ProfileLoaderArgs {
  context: Readonly<RouterContextProvider>;
}

export async function profileLoader({ context }: ProfileLoaderArgs): Promise<Result<{ user: User }>> {
  // User is guaranteed to be authenticated due to middleware
  const user = requireAuthUser(context);
  return ok({ user });
}

/**
 * Get user with authenticators - combines user and authenticator data
 */
export async function getUserWithAuthenticators(context: Readonly<RouterContextProvider>, userId: string): Promise<Result<{ user: User; authenticators: Authenticator[] }>> {
  const repository = getAuthRepository(context);

  const userResult = await repository.getUserById(userId);

  // Check for error (including not found)
  if (isError(userResult)) {
    return userResult;
  }

  const authenticatorsResult = await repository.getAuthenticatorsByUserId(userId);

  // Check for error
  if (isError(authenticatorsResult)) {
    return authenticatorsResult;
  }

  return {
    user: userResult,
    authenticators: authenticatorsResult,
  };
}
