import type { EmailConfig } from './@types/email.types';

/**
 * Default Email Configuration
 *
 * IMPORTANT: This configuration uses local-dev provider by default for development.
 * For production deployments, you MUST:
 * 1. Override this config in your app's config file (e.g., app/config/config.system.ts)
 * 2. Set active provider to 'resend' or 'mailchannels'
 * 3. Configure valid sendFrom addresses for your domain
 * 4. Set API keys via environment variables or Cloudflare bindings
 *
 */
export const defaultEmailConfig: EmailConfig = {
  active: 'local-dev',
  providers: [
    {
      name: 'local-dev',
      sendFrom: 'dev@localhost',
    },
  ],
};
