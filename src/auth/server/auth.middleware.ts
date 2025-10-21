import { setContext } from '@ycore/forge/context';
import { logger } from '@ycore/forge/logger';
import { isError, middlewarePassthrough } from '@ycore/forge/result';
import { type MiddlewareFunction, redirect } from 'react-router';

import type { AuthConfig } from '../@types/auth.config.types';
import { defaultAuthConfig, defaultAuthRoutes } from '../auth.config';
import { authConfigContext, authUserContext, getAuthUser } from './auth.context';
import { createAuthSessionStorage, destroyAuthSession, getAuthSession } from './session';

/**
 * Middleware that sets up auth configuration and loads user session
 * Only sets user in context if email is verified (fully authenticated)
 */
export function authSessionMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response> {
  return async ({ request, context }, next) => {
    // Set auth config in context for services to use
    setContext(context, authConfigContext, authConfig);

    // Load user from session
    const authSession = await getAuthSession(request, context);

    // If session loaded successfully and has a verified user, set it in context
    // Unverified users remain in session but NOT in context
    if (!isError(authSession) && authSession !== null && authSession.user) {
      if (authSession.user.emailVerified) {
        setContext(context, authUserContext, authSession.user);
      }
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
 * 3. Redirects verified users to signedin route
 * 4. Redirects unverified users to verify route
 */
export function unguardedAuthMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response>[] {
  return [authSessionMiddleware(authConfig), unprotectedAuthMiddleware(authConfig)];
}

/**
 * Combined middleware for protected routes that:
 * 1. Sets up auth configuration
 * 2. Loads user session
 * 3. Requires authentication
 */
export function guardedAuthMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response>[] {
  return [authSessionMiddleware(authConfig), protectedAuthMiddleware(authConfig)];
}

/**
 * Combined middleware for verify route that:
 * 1. Sets up auth configuration
 * 2. Loads user session
 * 3. Redirects verified users to signedin route
 * 4. Redirects users without session to signin route
 * 5. Only allows unverified users (session but not verified)
 */
export function verifyRouteMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response>[] {
  return [authSessionMiddleware(authConfig), verifyAuthMiddleware(authConfig)];
}

/**
 * Middleware specifically for the verify route.
 * Ensures only unverified users can access it.
 */
function verifyAuthMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response> {
  return async ({ request, context }, next) => {
    // Check if already fully authenticated (verified user in context)
    const user = getAuthUser(context);
    if (user) {
      throw redirect(authConfig?.routes.signedin || defaultAuthRoutes.signedin);
    }

    // Check if has session (unverified)
    const sessionResult = await getAuthSession(request, context);
    if (isError(sessionResult) || !sessionResult?.user) {
      throw redirect(authConfig?.routes.signin || defaultAuthRoutes.signin);
    }

    // Has unverified session - allow access to verify page
    return next();
  };
}

/**
 * Middleware that requires authentication for protected routes.
 * Redirects to configured signedOutRoute if user is not authenticated.
 *
 * Note: Context only contains verified users (set by authSessionMiddleware),
 * so if user exists in context, they are fully authenticated.
 */
function protectedAuthMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response> {
  return async ({ context }, next) => {
    const user = getAuthUser(context);
    if (!user) {
      throw redirect(authConfig?.routes.signedout || defaultAuthRoutes.signedout);
    }

    return next();
  };
}

/**
 * Middleware for public routes that should redirect if user has a session.
 * Redirects verified users to signedin route.
 * Redirects unverified users to verify route.
 * Only allows users with no session to access signin/signup pages.
 */
function unprotectedAuthMiddleware(authConfig: AuthConfig): MiddlewareFunction<Response> {
  return async ({ request, context }, next) => {
    // Check if fully authenticated (verified user in context)
    const user = getAuthUser(context);
    if (user) {
      throw redirect(authConfig?.routes.signedin || defaultAuthRoutes.signedin);
    }

    // Check if has unverified session (user in session but not context)
    const sessionResult = await getAuthSession(request, context);
    if (!isError(sessionResult) && sessionResult?.user && !sessionResult.user.emailVerified) {
      logger.info('unverified_user_redirecting_to_verify', {
        userId: sessionResult.user.id,
        email: sessionResult.user.email,
      });
      throw redirect(authConfig?.routes.verify || defaultAuthRoutes.verify);
    }

    return next();
  };
}
