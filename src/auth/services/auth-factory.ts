import { getDatabase } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';
import { AuthRepository } from './repository';
import { createAuthSessionStorage } from './session';

/**
 * Get authentication repository instance
 */
export function getAuthRepository(context: Readonly<RouterContextProvider>) {
  const db = getDatabase(context);
  return new AuthRepository(db);
}

/**
 * Factory function to create authentication dependencies.
 * Simplified functional approach without class-based strategies.
 */
export function createAuthenticator(context: Readonly<RouterContextProvider>) {
  const db = getDatabase(context);
  const repository = new AuthRepository(db);
  const sessionStorage = createAuthSessionStorage(context);

  return { 
    repository, 
    sessionStorage 
  };
}