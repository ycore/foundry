import { logger } from '@ycore/forge/logger';
import { middlewarePassthrough } from '@ycore/forge/result';
import { getBindings, isDevelopment } from '@ycore/forge/services';
import { createContext, type MiddlewareFunction } from 'react-router';
import type { CSRFData } from './@types/csrf.types';
import { resolveCSRF } from './csrf';

/*** CSRF token context for form protection */
export const csrfContext = createContext<CSRFData | null>(null);

/**
 * Middleware to generate CSRF token for forms
 * Sets csrfContext with token and CSRF cookie header
 */
export const commitCSRFMiddleware: MiddlewareFunction<Response> = async ({ context }, next) => {
  const { CSRF_COOKIE_SECRET_KEY } = getBindings(context);
  const csrf = resolveCSRF({ secret: CSRF_COOKIE_SECRET_KEY, secure: !isDevelopment(context) });
  const [token, cookieHeader] = await csrf.commitToken();
  context.set(csrfContext, { token });

  const response = await next();

  // Add CSRF cookie to response if needed
  if (cookieHeader) {
    return middlewarePassthrough(response, {
      append: { 'Set-Cookie': cookieHeader },
    });
  }

  return response;
};

/**
 * Middleware that automatically validates CSRF tokens on mutation requests.
 * Eliminates the need for manual CSRF validation in actions.
 *
 * For GET requests: passes through without validation
 * For POST/PUT/DELETE: validates CSRF token and throws error for React Router to handle
 */
export const validateCSRFMiddleware: MiddlewareFunction<Response> = async ({ request, context }, next) => {
  // Only process POST/PUT/DELETE requests
  if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
    return next();
  }

  const { CSRF_COOKIE_SECRET_KEY } = getBindings(context);
  const csrf = resolveCSRF({ secret: CSRF_COOKIE_SECRET_KEY, secure: !isDevelopment(context) });

  try {
    // Clone the request to read FormData without consuming original stream
    const clonedRequest = request.clone();
    const formData = await clonedRequest.formData();
    await csrf.validate(formData, request.headers);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token mismatch';

    throw new Response('Token mismatch', { status: 403, statusText: errorMessage });
  }

  return next();
};

/**
 * Middleware for public forms to implement CSRF protection.
 * Use: export const middleware = secureFormMiddleware;
 */
export const secureFormMiddleware = [commitCSRFMiddleware, validateCSRFMiddleware];
