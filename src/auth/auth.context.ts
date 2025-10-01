import { createContext, type RouterContextProvider } from 'react-router';
import type { AuthConfig } from './@types/auth.config.types';
import type { User } from './schema';

/**
 * Context for storing auth configuration
 */
export const authConfigContext = createContext<AuthConfig | null>(null);

/**
 * Get auth configuration from context
 */
export function getAuthConfig(context: Readonly<RouterContextProvider>): AuthConfig | null {
  return context.get(authConfigContext);
}

/**
 * Set auth configuration in context
 */
export function setAuthConfig(context: Readonly<RouterContextProvider>, config: AuthConfig): void {
  context.set(authConfigContext, config);
}

// Auth Session Context - stores authenticated user
export const authUserContext = createContext<User | null>(null);

// Helper to check if user is authenticated
export function isAuthenticated(context: Readonly<RouterContextProvider>): boolean {
  return context.get(authUserContext) !== null;
}

// Helper to get current user from context
export function getUser(context: Readonly<RouterContextProvider>): User | null {
  return context.get(authUserContext);
}
