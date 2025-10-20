import { setContext } from '@ycore/forge/context';
import { isError, middlewarePassthrough } from '@ycore/forge/result';
import { type MiddlewareFunction, redirect } from 'react-router';

import type { AuthConfig } from '../@types/auth.config.types';
import { defaultAuthConfig, defaultAuthRoutes } from '../auth.config';
import { authConfigContext, authUserContext, getAuthUser } from './auth.context';
import { createAuthSessionStorage, destroyAuthSession, getAuthSession } from './session';

/**
 * Middleware that sets up auth configuration and loads user session
 */
export function authSessionMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response> {
  return async ({ request, context }, next) => {
    // Set auth config in context for services to use
    setContext(context, authConfigContext, authConfig);

    // Load user from session
    const authSession = await getAuthSession(request, context);

    // If session loaded successfully and has a user, set it in context
    if (!isError(authSession) && authSession !== null && authSession.user) {
      setContext(context, authUserContext, authSession.user);
      return next();
    }

    // Check if there's an orphaned session cookie that needs cleanup
    const cookieHeader = request.headers.get('Cookie');
    const sessionCookieName = authConfig?.session.cookie.name || defaultAuthConfig.session.cookie.name;
    if (cookieHeader?.includes(sessionCookieName)) {
      // Get the session to check if it has any valid data (user, challenge, etc.)
      const sessionStorage = createAuthSessionStorage(context);
      const session = await sessionStorage.getSession(cookieHeader);

      // Only destroy if session is truly empty (no user or challenge)
      const hasUser = session.get('user');
      const hasChallenge = session.get('challenge');

      if (!hasUser && !hasChallenge) {
        // Truly orphaned session - clean it up
        const destroyResult = await destroyAuthSession(request, context);

        if (!isError(destroyResult)) {
          const response = await next();
          return middlewarePassthrough(response, { set: { 'Set-Cookie': destroyResult } });
        }
      }
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
export function unguardedAuthMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response>[] {
  const signedInRoute = authConfig?.routes.signedin || defaultAuthRoutes.signedin;
  return [authSessionMiddleware(authConfig), unprotectedAuthMiddleware(signedInRoute)];
}

/**
 * Combined middleware for protected routes that:
 * 1. Sets up auth configuration
 * 2. Loads user session
 * 3. Requires authentication
 */
export function guardedAuthMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response>[] {
  const signedOutRoute = authConfig?.routes.signedout || defaultAuthRoutes.signedout;
  return [authSessionMiddleware(authConfig), protectedAuthMiddleware(signedOutRoute)];
}

/**
 * Middleware that requires authentication for protected routes.
 * Redirects to configured signedOutRoute if user is not authenticated.
 */
function protectedAuthMiddleware(signedOutRoute: string): MiddlewareFunction<Response> {
  return async ({ context }, next) => {
    const user = getAuthUser(context);
    if (!user) {
      throw redirect(signedOutRoute);
    }

    return next();
  };
}

/**
 * Middleware for public routes that should redirect if user is already authenticated.
 * Useful for signin/signup pages.
 */
function unprotectedAuthMiddleware(signedInRoute: string): MiddlewareFunction<Response> {
  return async ({ context }, next) => {
    const user = getAuthUser(context);
    if (user) {
      throw redirect(signedInRoute);
    }

    return next();
  };
}
