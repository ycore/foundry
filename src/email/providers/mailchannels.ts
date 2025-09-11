import { logger } from '@ycore/forge/logger';
import type { AppError, AppResult } from '@ycore/forge/result';
import { createAppError, flattenErrors, returnFailure, returnSuccess, toAppError } from '@ycore/forge/result';
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

  async sendEmail(options: SendEmailOptions): Promise<AppResult<void, AppError>> {
    const { apiKey, to, from, template } = options;

    if (!from) {
      return returnFailure(createAppError('From address is required'));
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

      return returnSuccess(undefined);
    } catch (error) {
      const appError = toAppError(error);
      logger.error({
        event: 'email_send_failed',
        provider: 'mailchannels',
        to,
        message: flattenErrors(appError),
      });
      return returnFailure(createAppError(`Failed to send email via MailChannels: ${flattenErrors(appError)}`, undefined, appError.cause));
    }
  }
}
