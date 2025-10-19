import { getContext, requireContext } from '@ycore/forge/context';
import type { AppLoadContext } from 'react-router';

import { authUserContext } from '../auth.context';
import type { User } from '../schema';

/**
 * Require authenticated user from context
 * Throws Response(401) if user is not authenticated
 *
 * Use this in protected routes where authentication is mandatory
 *
 * @example
 * export const loader = async ({ context }) => {
 *   const user = requireAuthUser(context);
 *   return { user };
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
 * Use this when authentication is optional
 *
 * @example
 * export const loader = async ({ context }) => {
 *   const user = getAuthUser(context);
 *   return { user, isGuest: !user };
 * };
 */
export function getAuthUser(context: AppLoadContext): User | null {
  return getContext(context, authUserContext, null);
}

/**
 * Check if a user is currently authenticated
 * Returns true if a user is present in context, false otherwise
 *
 * Use this for conditional logic based on auth state
 *
 * @example
 * export const loader = async ({ context }) => {
 *   const authenticated = isAuthenticated(context);
 *   return { isAuthenticated: authenticated };
 * };
 */
export function isAuthenticated(context: AppLoadContext): boolean {
  return getContext(context, authUserContext, null) !== null;
}
