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
export const commitCSRFMiddleware: MiddlewareFunction<Response> = async ({ request, context }, next) => {
  // Only commit CSRF tokens for GET requests to avoid conflicts with validation
  if (request.method !== 'GET') {
    return next();
  }
  const bindings = getBindings(context);
  // In development, fall back to environment variables if bindings are not available
  const secret = bindings.CSRF_COOKIE_SECRET_KEY || process.env.CSRF_COOKIE_SECRET_KEY || 'fallback-csrf-secret';
  const csrf = resolveCSRF({ secret, secure: !isDevelopment(context) });
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

  const bindings = getBindings(context);
  // In development, fall back to environment variables if bindings are not available
  const secret = bindings.CSRF_COOKIE_SECRET_KEY || process.env.CSRF_COOKIE_SECRET_KEY || 'fallback-csrf-secret';
  const csrf = resolveCSRF({ secret, secure: !isDevelopment(context) });

  try {
    // Clone the request to read FormData without consuming original stream
    const clonedRequest = request.clone();
    const formData = await clonedRequest.formData();
    
    await csrf.validate(formData, request.headers);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token mismatch';
    logger.error('CSRF validation failed', { 
      error: errorMessage,
      formDataKeys: Array.from((await request.clone().formData()).keys())
    });

    throw new Response('Token mismatch', { status: 403, statusText: errorMessage });
  }

  return next();
};

/**
 * Middleware for public forms to implement CSRF protection.
 * Use: export const middleware = secureFormMiddleware;
 */
export const secureFormMiddleware = [commitCSRFMiddleware, validateCSRFMiddleware];
