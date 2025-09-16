import { getDatabase } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';
import { Authenticator } from 'remix-auth';
import type { UserDetails, WebAuthnAuthenticator, WebAuthnVerifyParams } from '../@types/auth.types';
import type { Authenticator as AuthenticatorModel, User } from '../schema';
import { AuthRepository } from './repository';
import { createAuthSessionStorage } from './session';
import { WebAuthnStrategy } from './webauthn-strategy';

export function createAuthenticator(context: Readonly<RouterContextProvider>) {
  const db = getDatabase(context);
  const repository = new AuthRepository(db);
  const sessionStorage = createAuthSessionStorage(context);

  const authenticator = new Authenticator<User>();

  const webAuthnStrategy = new WebAuthnStrategy<User>(
    {
      sessionStorage,
      rpName: 'React Router Cloudflare App',
      rpID: request => new URL(request.url).hostname,
      origin: request => new URL(request.url).origin,

      getUserAuthenticators: async (user): Promise<WebAuthnAuthenticator[]> => {
        if (!user) return [];

        const result = await repository.getAuthenticatorsByUserId(user.id);
        if (result.errors || !result.data) return [];

        return result.data.map(auth => ({
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
        return result.data || null;
      },

      getAuthenticatorById: async (id): Promise<AuthenticatorModel | null> => {
        const result = await repository.getAuthenticatorById(id);
        return result.data || null;
      },
    },
    async function verify({ authenticator: auth, type, username, displayName }: WebAuthnVerifyParams) {
      let user: User | null = null;

      if (type === 'registration') {
        const savedAuthResult = await repository.getAuthenticatorById(auth.id);
        if (savedAuthResult.data) {
          throw new Error('Authenticator has already been registered.');
        }

        if (!username) throw new Error('Username is required.');

        const existingUserResult = await repository.getUserByUsername(username);
        if (existingUserResult.data) {
          throw new Error('User already exists.');
        }

        // Use displayName or fallback to username
        const finalDisplayName = displayName || username;

        const createUserResult = await repository.createUser(username, finalDisplayName);
        if (createUserResult.errors || !createUserResult.data) {
          throw new Error('Failed to create user.');
        }

        user = createUserResult.data;

        const createAuthResult = await repository.createAuthenticator({
          ...auth,
          userId: user.id,
        });

        if (createAuthResult.errors) {
          throw new Error('Failed to create authenticator.');
        }
      } else if (type === 'authentication') {
        const savedAuthResult = await repository.getAuthenticatorById(auth.id);
        if (!savedAuthResult.data) {
          throw new Error('Authenticator not found');
        }

        const userResult = await repository.getUserById(savedAuthResult.data.userId);
        if (!userResult.data) {
          throw new Error('User not found');
        }

        user = userResult.data;

        if (auth.counter !== savedAuthResult.data.counter) {
          await repository.updateAuthenticatorCounter(auth.id, auth.counter);
        }
      }

      if (!user) throw new Error('User not found');
      return user;
    }
  );

  authenticator.use(webAuthnStrategy, 'webauthn');

  return { authenticator, webAuthnStrategy, sessionStorage, repository };
}
