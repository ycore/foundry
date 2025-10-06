import { logger } from '@ycore/forge/logger';
import { middlewarePassthrough } from '@ycore/forge/result';
import { getBindings, isDevelopment } from '@ycore/forge/services';
import { createContext, type MiddlewareFunction } from 'react-router';
import type { CSRFConfig, CSRFData } from './@types/csrf.types';
import { createCSRF } from './csrf';

/** CSRF token context for form protection */
export const csrfContext = createContext<CSRFData | null>(null);

/** Context to skip CSRF validation for specific requests */
export const skipCSRFValidation = createContext<boolean>(false);

/** Creates CSRF commit middleware (GET requests only) */
export function createCommitCSRFMiddleware(config: CSRFConfig): MiddlewareFunction<Response> {
  return async ({ request, context }, next) => {
    // Only commit CSRF tokens for GET requests to avoid conflicts with validation
    if (request.method !== 'GET') {
      return next();
    }

    const bindings = getBindings(context);
    // Access the secret using a type assertion since we can't know the binding names at compile time
    const secret = (bindings as Record<string, unknown>)[config.secretKey] as string | undefined;

    if (!secret) {
      logger.error('CSRF secret not found', {
        secretKey: config.secretKey,
        availableBindings: Object.keys(bindings),
      });
      throw new Error(`CSRF secret binding '${config.secretKey}' not found in environment`);
    }

    // Override secure flag in development
    const runtimeConfig = {
      ...config,
      cookie: {
        ...config.cookie,
        secure: isDevelopment(context) ? false : config.cookie.secure,
      },
    };

    const csrf = createCSRF(secret, runtimeConfig);
    const [token, cookieHeader] = await csrf.commitToken();

    // Set both token and config in context
    context.set(csrfContext, {
      token,
      formDataKey: config.formDataKey,
      headerName: config.headerName,
    });

    const response = await next();

    // Add CSRF cookie to response if needed
    if (cookieHeader) {
      return middlewarePassthrough(response, {
        append: { 'Set-Cookie': cookieHeader },
      });
    }
    return response;
  };
}

/** Creates CSRF validation middleware (POST/PUT/DELETE/PATCH) */
export function createValidateCSRFMiddleware(config: CSRFConfig): MiddlewareFunction<Response> {
  return async ({ request, context }, next) => {
    // Only process POST/PUT/DELETE requests
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      return next();
    }

    // Check and skip CSRF validation for this request
    const skipCSRF = context.get(skipCSRFValidation);
    if (skipCSRF) {
      context.set(skipCSRFValidation, false);
      return next();
    }

    const bindings = getBindings(context);
    // Access the secret using a type assertion since we can't know the binding names at compile time
    const secret = (bindings as Record<string, unknown>)[config.secretKey] as string | undefined;

    if (!secret) {
      logger.error('CSRF secret not found', {
        secretKey: config.secretKey,
        availableBindings: Object.keys(bindings),
      });
      throw new Error(`CSRF secret binding '${config.secretKey}' not found in environment`);
    }

    // Override secure flag in development
    const runtimeConfig = {
      ...config,
      cookie: {
        ...config.cookie,
        secure: isDevelopment(context) ? false : config.cookie.secure,
      },
    };

    const csrf = createCSRF(secret, runtimeConfig);

    try {
      // Clone the request to read FormData without consuming original stream
      const clonedRequest = request.clone();
      const formData = await clonedRequest.formData();

      await csrf.validate(formData, request.headers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token mismatch';
      logger.error('CSRF validation failed', {
        error: errorMessage,
        url: request.url,
        formDataKeys: Array.from((await request.clone().formData()).keys()),
        hasCsrfToken: (await request.clone().formData()).has(config.formDataKey),
      });

      throw new Response('Token mismatch', { status: 403, statusText: errorMessage });
    }

    return next();
  };
}

/** Creates complete CSRF middleware (commit + validation) */
export function createCSRFMiddleware(config: CSRFConfig): MiddlewareFunction<Response>[] {
  return [createCommitCSRFMiddleware(config), createValidateCSRFMiddleware(config)];
}
