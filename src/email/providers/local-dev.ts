import { logger } from '@ycore/forge/logger';
import type { Result } from '@ycore/forge/result';
import { err, tryCatch } from '@ycore/forge/result';
import type { EmailProvider, SendEmailOptions } from '../@types/email.types';

/**
 * Local dev Email Provider - Development provider that logs emails instead of sending
 */
export class MockEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<Result<void>> {
    const { to, from, template } = options;

    if (!from) {
      return err('From address is required');
    }

    return tryCatch(async () => {
      // Simulate a slight delay like a real email service
      await new Promise(resolve => setTimeout(resolve, 100));

      logger.info({
        event: 'local_dev_email_sent',
        provider: 'local-dev',
        from,
        to,
        subject: template.subject,
        // htmlLength: template.html.length,
        text: template.text,
      });

      return; // Success - void return
    }, 'Failed to send mock email');
  }
}
