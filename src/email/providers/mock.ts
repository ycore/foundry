import { logger } from '@ycore/forge/utils';
import type { EmailProvider, SendEmailOptions } from '../@types/email.types';

/**
 * Mock Email Provider
 * Development provider that logs emails instead of sending them
 */
export class MockEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { to, from, template } = options;

    if (!from) {
      throw new Error('From address is required');
    }

    // Simulate a slight delay like a real email service
    await new Promise(resolve => setTimeout(resolve, 100));

    logger.debug({
      event: 'mock_email_sent',
      provider: 'mock',
      from,
      to,
      subject: template.subject,
      htmlLength: template.html.length,
      textLength: template.text.length,
    });

    // In development, you could also log the full content
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Mock Email Sent:');
      console.log(`From: ${from}`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${template.subject}`);
      console.log(`Text: ${template.text}`);
      console.log(`HTML: ${template.html}`);
      console.log('---');
    }
  }
}
