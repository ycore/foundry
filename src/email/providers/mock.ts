import { logger } from '@ycore/forge/logger';
import type { Result } from '@ycore/forge/result';
import { err, tryCatch } from '@ycore/forge/result';
import type { EmailProvider, SendEmailOptions } from '../@types/email.types';

/**
 * Mock Email Provider
 * Development provider that logs emails instead of sending them
 */
export class MockEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<Result<void>> {
    const { to, from, template } = options;

    if (!from) {
      return err('From address is required');
    }

    return tryCatch(
      async () => {
        // Simulate a slight delay like a real email service
        await new Promise(resolve => setTimeout(resolve, 100));

        logger.debug({
          event: 'email_mock_sent',
          provider: 'mock',
          from,
          to,
          subject: template.subject,
          // htmlLength: template.html.length,
          text: template.text,
        });

        // In development, you could also log the full content
        // if (process.env.NODE_ENV === 'development') {
        //   console.log('📧 Mock Email Sent:');
        //   console.log(`From: ${from}`);
        //   console.log(`To: ${to}`);
        //   console.log(`Subject: ${template.subject}`);
        //   console.log(`Text: ${template.text}`);
        //   console.log(`HTML: ${template.html}`);
        //   console.log('---');
        // }

        return; // Success - void return
      },
      'Failed to send mock email'
    );
  }
}
