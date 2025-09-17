import { isError } from '@ycore/forge/result';
import type { RouterContextProvider, SessionStorage } from 'react-router';
import type { UserDetails, WebAuthnAuthenticator, WebAuthnVerifyParams } from '../@types/auth.types';
import { getAuthConfig } from '../auth-config.context';
import type { Authenticator as AuthenticatorModel, User } from '../schema';
import type { AuthRepository } from './repository';
import { WebAuthnStrategy } from './webauthn-strategy';

/**
 * Factory function to create a WebAuthn strategy.
 * Single responsibility: Configure WebAuthn authentication strategy.
 */
export function createWebAuthnStrategy(repository: AuthRepository, sessionStorage: SessionStorage, context: Readonly<RouterContextProvider>) {
  const authConfig = getAuthConfig(context);
  if (!authConfig) {
    throw new Error('Auth configuration not found in context. Ensure auth middleware is properly configured.');
  }

  const { webauthn } = authConfig;

  return new WebAuthnStrategy<User>(
    {
      sessionStorage,
      rpName: webauthn.rpName,
      rpID: webauthn.rpID,
      origin: webauthn.origin,
      challengeSessionKey: webauthn.challengeSessionKey,
      requireUserVerification: webauthn.requireUserVerification,

      getUserAuthenticators: async (user): Promise<WebAuthnAuthenticator[]> => {
        if (!user) return [];

        const result = await repository.getAuthenticatorsByUserId(user.id);
        if (isError(result)) return [];

        return result.map(auth => ({
          id: auth.id,
          transports: auth.transports.split(','),
        }));
      },

      getUserDetails: async (user): Promise<UserDetails | null> => {
        return user
          ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
          }
          : null;
      },

      getUserByUsername: async (username): Promise<User | null> => {
        const result = await repository.getUserByUsername(username);
        return isError(result) ? null : result;
      },

      getAuthenticatorById: async (id): Promise<AuthenticatorModel | null> => {
        const result = await repository.getAuthenticatorById(id);
        return isError(result) ? null : result;
      },
    },
    createVerifyFunction(repository)
  );
}

/**
 * Creates the verify function for WebAuthn authentication.
 * Single responsibility: Handle user verification and registration logic.
 */
function createVerifyFunction(repository: AuthRepository) {
  return async function verify({ authenticator: auth, type, username, displayName }: WebAuthnVerifyParams): Promise<User> {
    if (type === 'registration') {
      return handleRegistration(repository, auth, username, displayName);
    }

    if (type === 'authentication') {
      return handleAuthentication(repository, auth);
    }

    throw new Error('Invalid authentication type');
  };
}

/**
 * Handles new user registration with WebAuthn.
 * Single responsibility: Register new users with passkey.
 */
async function handleRegistration(repository: AuthRepository, auth: Omit<AuthenticatorModel, 'userId' | 'createdAt' | 'updatedAt'>, username: string | null, displayName?: string): Promise<User> {
  // Check if authenticator already exists
  const savedAuthResult = await repository.getAuthenticatorById(auth.id);
  if (!isError(savedAuthResult)) {
    throw new Error('Authenticator has already been registered');
  }

  if (!username) {
    throw new Error('Username is required');
  }

  // Check if user already exists
  const existingUserResult = await repository.getUserByUsername(username);
  if (!isError(existingUserResult)) {
    throw new Error('User already exists');
  }

  // Create new user
  const finalDisplayName = displayName || username;
  const createUserResult = await repository.createUser(username, finalDisplayName);

  if (isError(createUserResult)) {
    throw new Error(createUserResult.message || 'Failed to create user');
  }

  const user = createUserResult;

  // Create authenticator for the user
  const createAuthResult = await repository.createAuthenticator({
    ...auth,
    userId: user.id,
  });

  if (isError(createAuthResult)) {
    throw new Error(createAuthResult.message || 'Failed to create authenticator');
  }

  return user;
}

/**
 * Handles user authentication with existing passkey.
 * Single responsibility: Authenticate existing users.
 */
async function handleAuthentication(repository: AuthRepository, auth: Omit<AuthenticatorModel, 'userId' | 'createdAt' | 'updatedAt'>): Promise<User> {
  // Find the saved authenticator
  const savedAuthResult = await repository.getAuthenticatorById(auth.id);
  if (isError(savedAuthResult)) {
    throw new Error('Authenticator not found');
  }

  // Find the user
  const userResult = await repository.getUserById(savedAuthResult.userId);
  if (isError(userResult)) {
    throw new Error('User not found');
  }

  // Update counter if needed
  if (auth.counter !== savedAuthResult.counter) {
    await repository.updateAuthenticatorCounter(auth.id, auth.counter);
  }

  return userResult;
}
