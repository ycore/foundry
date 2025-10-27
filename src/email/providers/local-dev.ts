import { logger } from '@ycore/forge/logger';
import type { EmailProvider } from '../@types/email.types';
import { createEmailProviderBase, EMAIL_PROVIDER_DELAYS } from './base-provider';

/**
 * Local Dev Email Provider - Development provider that logs emails instead of sending
 */
export function createLocalDevEmailProvider(): EmailProvider {
  return createEmailProviderBase('local-dev', async options => {
    const { to, from, template } = options;

    // Simulate a slight delay like a real email service
    await new Promise(resolve => setTimeout(resolve, EMAIL_PROVIDER_DELAYS.LOCAL_DEV));

    logger.info('local_dev_email_sent', {
      provider: 'local-dev',
      from,
      to,
      subject: template.subject,
      text: template.text,
    });
  });
}
