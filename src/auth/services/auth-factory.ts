import { getDatabase } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';
import { Authenticator } from 'remix-auth';
import type { User } from '../schema';
import { AuthRepository } from './repository';
import { createAuthSessionStorage } from './session';
import { createWebAuthnStrategy } from './webauthn-factory';

/**
 * Factory function to create a configured authenticator instance.
 * Single responsibility: Creates and configures the authenticator with WebAuthn strategy.
 */
export function createAuthenticator(context: Readonly<RouterContextProvider>) {
  const db = getDatabase(context);
  const repository = new AuthRepository(db);
  const sessionStorage = createAuthSessionStorage(context);
  const authenticator = new Authenticator<User>();

  // Create and register WebAuthn strategy
  const webAuthnStrategy = createWebAuthnStrategy(repository, sessionStorage, context);
  authenticator.use(webAuthnStrategy, 'webauthn');

  return { authenticator, webAuthnStrategy, sessionStorage, repository };
}
