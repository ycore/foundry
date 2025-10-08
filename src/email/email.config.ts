import type { EmailConfig } from './@types/email.types';

export const defaultEmailConfig: EmailConfig = {
  active: 'local-dev', // Default to local-dev (dev)
  providers: [
    {
      name: 'resend',
      sendFrom: 'noreply@example.com',
    },
    {
      name: 'mailchannels',
      sendFrom: 'noreply@example.com',
    },
    {
      name: 'local-dev',
      sendFrom: 'dev@localhost',
    },
  ],
};
