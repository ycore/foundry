import type { SecretBindings } from '@ycore/forge/services';

/**
 * CSRF configuration that can be extended in app config
 */
export interface CSRFConfig {
  /** Name of the Cloudflare binding containing the CSRF secret */
  secretKey: SecretBindings;
  /** Name of the CSRF cookie */
  cookieName: string;
  /** Cookie settings */
  cookie: {
    /** HTTP only flag - prevents JavaScript access */
    httpOnly: boolean;
    /** SameSite attribute for CSRF protection */
    sameSite: 'strict' | 'lax' | 'none';
    /** Cookie path */
    path: string;
    /** Secure flag - requires HTTPS in production */
    secure: boolean;
    /** Max age in seconds (optional) */
    maxAge?: number;
  };
}

/**
 * CSRF data stored in context
 */
export interface CSRFData {
  /** The CSRF token */
  token: string;
  /** Whether the token has been validated (server-side only) */
  validated?: boolean;
  /** Whether validation is needed (server-side only) */
  needsValidation?: boolean;
}
