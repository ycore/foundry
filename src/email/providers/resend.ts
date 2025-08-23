import { getErrorMessage, logger } from '@ycore/forge/utils';
import type { EmailProvider, SendEmailOptions } from '../@types/email.types';

/**
 * Resend Email Provider
 * Implementation for Resend email service
 */
export class ResendEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { apiKey, to, from, template } = options;

    if (!from) {
      throw new Error('From address is required');
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
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error({
        event: 'email_send_error',
        provider: 'resend',
        to,
        message,
      });
      throw new Error(`Failed to send email: ${message}`);
    }
  }
}
