import { getOrigin, getOriginDomain, isDevelopment } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';

/**
 * Detect if the request is for localhost or 127.0.0.1
 */
function isLocalhostDomain(domain: string): boolean {
  return domain === 'localhost' || domain === '127.0.0.1' || domain === '[::1]';
}

/**
 * Resolve WebAuthn rpID from context and request
 */
export function resolveRpId(context: Readonly<RouterContextProvider>, request: Request): string {
  const originDomain = getOriginDomain(context, request);

  // WebAuthn spec requires exactly 'localhost' for localhost requests
  if (isLocalhostDomain(originDomain)) {
    return 'localhost';
  }

  return originDomain;
}

/**
 * Resolve WebAuthn origins from context and request
 *
 * Security model:
 * - Production: Strict - only allows configured origin (from SITE_URL env or request origin)
 * - Development: Permissive - allows both configured origin and request origin
 *
 * This ensures production deployments validate against the configured origin while
 * development environments automatically work with localhost on any port.
 */
export function resolveOrigins(context: Readonly<RouterContextProvider>, request: Request): string[] {
  const originUrl = getOrigin(context, request);
  const requestOrigin = new URL(request.url).origin;
  const isDevMode = isDevelopment(context);

  // Development: Allow both configured origin and request origin for flexibility
  if (isDevMode) {
    return [...new Set([originUrl, requestOrigin])];
  }

  // Production: Strict - only configured origin
  return [originUrl];
}

/**
 * Validate that a client origin is in the list of allowed origins
 */
export function validateOrigin(clientOrigin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.includes(clientOrigin);
}
