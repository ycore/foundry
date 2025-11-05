import { setContext } from '@ycore/forge/context';
import type { MiddlewareFunction } from 'react-router';
import { emailContext } from '@ycore/foundry/email';
import type { EmailConfig } from '../@types/email.types';

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
