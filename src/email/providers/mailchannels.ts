import { getErrorMessage, logger } from '@ycore/forge/utils';
import type { EmailProvider, SendEmailOptions } from '../@types/email.types';

/**
 * MailChannels Email Provider
 * Implementation for MailChannels email service
 *
 * Requires DNS record for authorization:
 * Type: TXT, Name: _mailchannels, Content: "v=mc1 auth=<AccountId>"
 */
export class MailChannelsEmailProvider implements EmailProvider {
  private readonly apiUrl = 'https://api.mailchannels.net/tx/v1/send';

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { apiKey, to, from, template } = options;

    if (!from) {
      throw new Error('From address is required');
    }

    try {
      const payload = {
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: { email: from },
        subject: template.subject,
        content: [
          { type: 'text/plain', value: template.text },
          { type: 'text/html', value: template.html },
        ],
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MailChannels API error: ${response.status} ${errorText}`);
      }

      logger.debug({
        event: 'email_sent_success',
        provider: 'mailchannels',
        to,
        subject: template.subject,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error({
        event: 'email_send_error',
        provider: 'mailchannels',
        to,
        message,
      });
      throw new Error(`Failed to send email via MailChannels: ${message}`);
    }
  }
}
