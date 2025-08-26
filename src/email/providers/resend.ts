import type { ErrorCollection, TypedResult } from '@ycore/forge/error';
import { flattenErrors, returnFailure, returnSuccess, transformError } from '@ycore/forge/error';
import { logger } from '@ycore/forge/logger';
import type { EmailProvider, SendEmailOptions } from '../@types/email.types';

/**
 * Resend Email Provider
 * Implementation for Resend email service
 */
export class ResendEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<TypedResult<void, ErrorCollection>> {
    const { apiKey, to, from, template } = options;

    if (!from) {
      return returnFailure([{ messages: ['From address is required'] }]);
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
      const errorResult = transformError(error);
      logger.error({
        event: 'email_send_error',
        provider: 'resend',
        to,
        message: flattenErrors([errorResult]),
      });
      return returnFailure([{ messages: [`Failed to send email: ${flattenErrors([errorResult])}`] }]);
    }
  }
}
