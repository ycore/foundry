import { createContext, type MiddlewareFunction, type RouterContextProvider, redirect } from 'react-router';
import type { AuthConfig } from './@types/auth.config.types';
import { defaultAuthRoutes } from './auth.config';
import { setAuthConfig } from './auth-config.context';
import type { User } from './schema';
import { getAuthSession } from './services/session';

// Auth Session Context - stores authenticated user
export const authUserContext = createContext<User | null>(null);

// Stores auth configuration
export const authConfigContext = createContext<{ signedOutRoute: string }>({ signedOutRoute: defaultAuthRoutes.signedout });

// Helper to check if user is authenticated
export function isAuthenticated(context: Readonly<RouterContextProvider>): boolean {
  return context.get(authUserContext) !== null;
}

// Helper to get current user from context
export function getUser(context: Readonly<RouterContextProvider>): User | null {
  return context.get(authUserContext);
}

// Helper to get signed out route from context
export function getSignedOutRoute(context: Readonly<RouterContextProvider>): string {
  const config = context.get(authConfigContext);
  return config?.signedOutRoute || defaultAuthRoutes.signedout;
}

/**
 * Middleware that sets up auth configuration and loads user session
 */
export function authSessionMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response> {
  return async ({ request, context }, next) => {
    // Set auth config in context for services to use
    setAuthConfig(context, authConfig);

    // Set auth config context for route helpers
    context.set(authConfigContext, { signedOutRoute: authConfig.routes.signedout });

    // Load user from session
    const sessionResult = await getAuthSession(request, context);
    if (sessionResult.data?.user) {
      context.set(authUserContext, sessionResult.data.user);
    }

    return next();
  };
}

/**
 * Middleware that requires authentication for protected routes.
 * Redirects to configured signedOutRoute if user is not authenticated.
 */
export function authGuardMiddleware(): MiddlewareFunction<Response> {
  return async ({ context }, next) => {
    const user = context.get(authUserContext);
    if (!user) {
      const signedOutRoute = getSignedOutRoute(context);
      throw redirect(signedOutRoute);
    }

    return next();
  };
}

/**
 * Middleware for public routes that should redirect if user is already authenticated.
 * Useful for login/signup pages.
 */
export function publicRouteMiddleware(signedInRoute: string): MiddlewareFunction<Response> {
  return async ({ context }, next) => {
    const user = context.get(authUserContext);
    if (user) {
      throw redirect(signedInRoute);
    }

    return next();
  };
}

/**
 * Combined middleware for auth routes that:
 * 1. Sets up auth configuration
 * 2. Loads user session
 * 3. Redirects if already authenticated
 */
export function authRouteMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response>[] {
  return [authSessionMiddleware(authConfig), publicRouteMiddleware(authConfig.routes.signedin)];
}

/**
 * Combined middleware for protected routes that:
 * 1. Sets up auth configuration
 * 2. Loads user session
 * 3. Requires authentication
 */
export function protectedRouteMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response>[] {
  return [authSessionMiddleware(authConfig), authGuardMiddleware()];
}
