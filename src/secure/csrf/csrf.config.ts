import type { CSRFConfig } from './@types/csrf.types';

/**
 * Default CSRF configuration
 * Can be overridden in app's config.system.ts
 */
export const defaultCSRFConfig: CSRFConfig = {
  secretKey: 'UNCONFIGURED',
  cookieName: '__csrf',
  formDataKey: 'csrf_token',
  headerName: 'x-csrf-token',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: true,
    maxAge: undefined, // Session cookie by default
  },
};
