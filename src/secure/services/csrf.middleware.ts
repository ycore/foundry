import { middlewarePassthrough } from '@ycore/forge/http';
import { getBindings } from '@ycore/forge/services';
import { unstable_createContext } from 'react-router';
import type { CSRFData } from '../@types/csrf.types';
import { resolveCSRF } from './csrf';


/*** CSRF token context for form protection */
export const csrfContext = unstable_createContext<CSRFData | null>(null);

/**
 * Middleware for public forms to implement CSRF protection.
 * Use: export const unstable_middleware = secureFormMiddleware;
 */
export const secureFormMiddleware = [commitCSRFMiddleware, validateCSRFMiddleware];

/**
 * Middleware to generate CSRF token for forms
 * Sets csrfContext with token and CSRF cookie header
 */
export async function commitCSRFMiddleware({ context }: any, next: () => Promise<Response>) {
  const { CSRF_COOKIE_SECRET_KEY, ENVIRONMENT } = getBindings(context);
  const csrf = resolveCSRF({ secret: CSRF_COOKIE_SECRET_KEY, secure: ENVIRONMENT !== 'development' });
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
}

/**
 * Middleware that automatically validates CSRF tokens on mutation requests.
 * Eliminates the need for manual CSRF validation in actions.
 *
 * For GET requests: passes through without validation
 * For POST/PUT/DELETE: validates CSRF token and throws error for React Router to handle
 */
export async function validateCSRFMiddleware({ request, context }: any, next: () => Promise<Response>) {
  // Only process POST/PUT/DELETE requests
  if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
    return next();
  }

  const { CSRF_COOKIE_SECRET_KEY, ENVIRONMENT } = getBindings(context);
  const csrf = resolveCSRF({ secret: CSRF_COOKIE_SECRET_KEY, secure: ENVIRONMENT !== 'development' });

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
}
