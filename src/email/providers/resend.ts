import type { EmailProvider } from '../@types/email.types';
import { createEmailProviderBase } from './base-provider';

/**
 * Resend Email Provider
 * Implementation for Resend email service (https://resend.com)
 */
export function createResendEmailProvider(): EmailProvider {
  return createEmailProviderBase('resend', async options => {
    const { apiKey, to, from, template } = options;

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
      const errorText = await response.text();
      throw new Error(`Resend API error (${response.status}): ${errorText}`);
    }
  });
}
