import { logger } from '@ycore/forge/logger';
import { middlewarePassthrough } from '@ycore/forge/result';
import { getBindings, isDevelopment } from '@ycore/forge/services';
import type { MiddlewareFunction } from 'react-router';
import type { CSRFConfig } from '../@types/csrf.types';
import { createCSRF } from './csrf';
import { csrfContext, skipCSRFValidation } from './csrf.context';

/** Creates CSRF commit middleware (GET requests only) */
export function createCommitCSRFMiddleware(config: CSRFConfig): MiddlewareFunction<Response> {
  return async ({ request, context }, next) => {
    // Only commit CSRF tokens for GET requests to avoid conflicts with validation
    if (request.method !== 'GET') {
      return next();
    }

    const bindings = getBindings(context);

    if (!bindings) {
      logger.error('csrf_bindings_not_available', { secretKey: config.secretKey });
      throw new Error('Cloudflare bindings not available - context setup issue');
    }

    // Access the secret using bracket notation to ensure runtime safety
    const secret = bindings[config.secretKey as keyof typeof bindings] as string | undefined;

    if (!secret) {
      logger.error('csrf_secret_not_found', { secretKey: config.secretKey, availableBindings: Object.keys(bindings) });
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

    // Set token in context
    const csrfData = { token };
    context.set(csrfContext, csrfData);

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

    // Error handling for missing bindings
    if (!bindings) {
      logger.error('csrf_bindings_not_available', { secretKey: config.secretKey });
      throw new Error('Cloudflare bindings not available - context setup issue');
    }

    // Access the secret using bracket notation to ensure runtime safety
    const secret = bindings[config.secretKey as keyof typeof bindings] as string | undefined;

    if (!secret) {
      logger.error('csrf_secret_not_found', { secretKey: config.secretKey, availableBindings: Object.keys(bindings) });
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
      logger.error('csrf_validation_failed', { error: errorMessage, url: request.url });

      throw new Response('Token mismatch', { status: 403, statusText: errorMessage });
    }

    return next();
  };
}

/** Creates complete CSRF middleware (commit + validation) */
export function createCSRFMiddleware(config: CSRFConfig): MiddlewareFunction<Response>[] {
  return [createCommitCSRFMiddleware(config), createValidateCSRFMiddleware(config)];
}
