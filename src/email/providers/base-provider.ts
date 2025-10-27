import { logger } from '@ycore/forge/logger';
import type { Result } from '@ycore/forge/result';
import { err, tryCatch } from '@ycore/forge/result';
import type { EmailProvider, SendEmailOptions } from '../@types/email.types';

/**
 * Configuration delays for email providers (in milliseconds)
 */
export const EMAIL_PROVIDER_DELAYS = {
  LOCAL_DEV: 800,
  TEST_MOCK: 10,
} as const;

/**
 * Base email provider factory - creates an EmailProvider with common validation and error handling logic
 */
export function createEmailProviderBase(name: string, sendFn: (options: SendEmailOptions) => Promise<void>): EmailProvider {
  return {
    async sendEmail(options: SendEmailOptions): Promise<Result<void>> {
      const { from, to, template } = options;

      if (!from) {
        return err('From address is required');
      }

      return tryCatch(async () => {
        await sendFn(options);

        logger.debug('email_sent_success', {
          provider: name,
          to,
          subject: template.subject,
        });
      }, `Failed to send email via ${name}`);
    },
  };
}
