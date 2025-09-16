import { createContext, type RouterContextProvider } from 'react-router';
import type { AuthConfig } from './@types/auth.config.types';

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
export function setAuthConfig(context: RouterContextProvider, config: AuthConfig): void {
  context.set(authConfigContext, config);
}
