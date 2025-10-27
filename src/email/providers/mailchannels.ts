import type { EmailProvider } from '../@types/email.types';
import { createEmailProviderBase } from './base-provider';

/**
 * MailChannels Email Provider
 * Implementation for MailChannels email service
 *
 * Requires DNS record for authorization:
 * Type: TXT, Name: _mailchannels, Content: "v=mc1 auth=<AccountId>"
 */
export function createMailChannelsEmailProvider(): EmailProvider {
  const apiUrl = 'https://api.mailchannels.net/tx/v1/send';

  return createEmailProviderBase('mailchannels', async (options) => {
    const { apiKey, to, from, template } = options;

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

    const response = await fetch(apiUrl, {
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
      throw new Error(`MailChannels API error (${response.status}): ${errorText}`);
    }
  });
}
