import type { MiddlewareFunction } from 'react-router';
import { createSecureHeadersMiddleware } from 'remix-utils/middleware/secure-headers';

export type { createSecureHeadersMiddleware as SecureHeaders } from 'remix-utils/middleware/secure-headers';

/**
 * Creates secure headers middleware with optional configuration
 */
export function secureHeadersMiddleware(config?: createSecureHeadersMiddleware.SecureHeadersOptions): MiddlewareFunction<Response> {
  const [middleware] = createSecureHeadersMiddleware(config);
  return middleware;
}
