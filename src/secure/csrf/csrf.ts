import { createCookie } from 'react-router';
import { CSRF } from 'remix-utils/csrf/server';

import type { CSRFConfig } from './@types/csrf.types';

/** Creates fresh CSRF instance with config (ensures request isolation) */
export function createCSRF(secret: string, config: CSRFConfig): CSRF {
  const cookie = createCookie(config.cookieName, {
    path: config.cookie.path,
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.maxAge,
    secrets: [secret],
  });

  return new CSRF({
    cookie,
    secret,
    formDataKey: config.formDataKey
  });
}