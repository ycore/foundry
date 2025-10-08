import { logger } from '@ycore/forge/logger';
import type { Result } from '@ycore/forge/result';
import { err, tryCatch } from '@ycore/forge/result';
import type { EmailProvider, SendEmailOptions } from '../@types/email.types';

/**
 * Resend Email Provider
 * Implementation for Resend email service
 */
export class ResendEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<Result<void>> {
    const { apiKey, to, from, template } = options;

    if (!from) {
      return err('From address is required');
    }

    return tryCatch(async () => {
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

      return; // Success - void return
    }, 'Failed to send email via Resend');
  }
}
