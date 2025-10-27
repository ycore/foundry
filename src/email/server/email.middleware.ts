import { setContext } from '@ycore/forge/context';
import type { MiddlewareFunction } from 'react-router';
import type { EmailConfig } from '../@types/email.types';
import { emailContext } from '../email.context';

/**
 * Email configuration middleware
 *
 * Injects email configuration into React Router context for use by email services.
 * This eliminates prop-drilling of email config through function parameters.
 */
export function emailConfigMiddleware(emailConfig: EmailConfig): MiddlewareFunction<Response> {
  return async ({ context }, next) => {
    setContext(context, emailContext, emailConfig);
    return next();
  };
}
