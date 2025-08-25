import type { ErrorCollection, TypedResult } from '@ycore/forge/error';
import { logger, returnFailure, returnSuccess } from '@ycore/forge/error';
import type { EmailProvider, SendEmailOptions } from '../@types/email.types';

/**
 * Mock Email Provider
 * Development provider that logs emails instead of sending them
 */
export class MockEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<TypedResult<void, ErrorCollection>> {
    const { to, from, template } = options;

    if (!from) {
      return returnFailure([{ messages: ['From address is required'] }]);
    }

    try {
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

      return returnSuccess(undefined);
    } catch (error) {
      return returnFailure([{ messages: [`Failed to send mock email: ${error instanceof Error ? error.message : 'Unknown error'}`] }]);
    }
  }
}
