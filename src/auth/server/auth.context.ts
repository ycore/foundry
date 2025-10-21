import { getContext, requireContext } from '@ycore/forge/context';
import type { AppLoadContext } from 'react-router';
import { createContext } from 'react-router';

import type { AuthConfig } from '../@types/auth.config.types';
import type { User } from '../schema';

export const authConfigContext = createContext<AuthConfig | null>(null);

export const authUserContext = createContext<User | null>(null);

/**
 * Require authenticated user from context
 * Throws Response(401) if user is not authenticated
 *
 * Note: Context only contains VERIFIED users (passkey + email verified).
 * Unverified users exist in session but NOT in context.
 * "Authenticated" always means "fully verified" in this system.
 *
 * @example
 * export const loader = async ({ context }) => {
 *   const user = requireAuthUser(context);
 *   return { user }; // user is guaranteed to be verified
 * };
 */
export function requireAuthUser(context: AppLoadContext): User {
  const user = requireContext(context, authUserContext, {
    errorMessage: 'Authentication required - user must be logged in to access this resource',
    errorStatus: 401,
  });

  return user;
}

/**
 * Get authenticated user from context (optional)
 * Returns null if user is not authenticated
 *
 * Note: Context only contains VERIFIED users (passkey + email verified).
 * Returns null for both guests AND unverified users.
 * "Authenticated" always means "fully verified" in this system.
 *
 * @example
 * export const loader = async ({ context }) => {
 *   const user = getAuthUser(context);
 *   return { user, isGuest: !user }; // user is verified or null
 * };
 */
export function getAuthUser(context: AppLoadContext): User | null {
  return getContext(context, authUserContext, null);
}

/**
 * Check if a user is currently authenticated
 * Returns true if a user is present in context, false otherwise
 *
 * Note: "Authenticated" means FULLY VERIFIED (passkey + email).
 * Returns false for both guests AND unverified users.
 * Context only contains verified users; unverified users exist in session only.
 *
 * @example
 * export const loader = async ({ context }) => {
 *   const authenticated = isAuthenticated(context);
 *   return { isAuthenticated: authenticated }; // true = verified
 * };
 */
export function isAuthenticated(context: AppLoadContext): boolean {
  return getContext(context, authUserContext, null) !== null;
}
