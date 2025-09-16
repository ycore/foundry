import { createCookie } from 'react-router';
import { CSRF } from 'remix-utils/csrf/server';

import type { CSRFOptions } from './@types/csrf.types';

const CSRF_CONFIG = {
  SECRET: 'fallback-secret',
  COOKIE_NAME: 'csrf',
  FORM_DATA_KEY: 'csrf_token',
} as const;

/** Singleton cache for CSRF instances */
let csrfInstance: CSRF | null = null;
let configCache: string | null = null;

/**
 * Resolves a CSRF instance using lazy singleton pattern.
 *
 * Implements a lazy singleton pattern that creates and caches CSRF instances.
 * When called with options, configures a new instance if needed. When called without
 * options, returns the previously configured singleton instance if it exists.
 *
 * It allows runtime configuration from Cloudflare Workers context in the loader,
 * then reuse of the same instance in the action without re-passing configuration.
 */
export function resolveCSRF(options?: CSRFOptions): CSRF {
  const hasOptions = options && Object.keys(options).length > 0;

  // If options haven't changed and instance is cached, return it
  if (!hasOptions && csrfInstance) {
    return csrfInstance;
  }

  // Normalize configuration
  const config = normalizeConfig(options);
  const configKey = JSON.stringify(config);

  // Return cached instance if configuration matches
  if (csrfInstance && configCache === configKey) {
    return csrfInstance;
  }

  // Create new instance and cache it
  csrfInstance = createCSRF(config);
  configCache = configKey;
  return csrfInstance;
}

function createCSRF(config: Required<CSRFOptions>) {
  const { secret, cookieName, formDataKey, secure } = config;

  const cookie = createCookie(cookieName, {
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    secrets: [secret],
  });

  return new CSRF({ cookie, secret, formDataKey });
}

/**
 * Normalizes CSRF configuration with defaults applied.
 */
function normalizeConfig(options?: CSRFOptions) {
  return {
    secret: options?.secret || CSRF_CONFIG.SECRET,
    cookieName: options?.cookieName || CSRF_CONFIG.COOKIE_NAME,
    formDataKey: options?.formDataKey || CSRF_CONFIG.FORM_DATA_KEY,
    secure: options?.secure || true,
  };
}
