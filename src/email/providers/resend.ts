import { logger } from '@ycore/forge/logger';
import type { AppError, AppResult } from '@ycore/forge/result';
import { createAppError, flattenErrors, returnFailure, returnSuccess, toAppError } from '@ycore/forge/result';
import type { EmailProvider, SendEmailOptions } from '../@types/email.types';

/**
 * Resend Email Provider
 * Implementation for Resend email service
 */
export class ResendEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<AppResult<void, AppError>> {
    const { apiKey, to, from, template } = options;

    if (!from) {
      return returnFailure(createAppError('From address is required'));
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${response.status} ${error}`);
      }

      logger.debug({
        event: 'email_sent_success',
        provider: 'resend',
        to,
      });

      return returnSuccess(undefined);
    } catch (error) {
      const appError = toAppError(error);
      logger.error({
        event: 'email_send_failed',
        provider: 'resend',
        to,
        message: flattenErrors(appError),
      });
      return returnFailure(createAppError(`Failed to send email: ${flattenErrors(appError)}`, undefined, appError.cause));
    }
  }
}
