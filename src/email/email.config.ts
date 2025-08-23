import type { EmailConfig } from './@types/email.types';

export const defaultEmailConfig: EmailConfig = {
  active: 'mock', // Default to mock (dev)
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
      name: 'mock',
      sendFrom: 'dev@localhost',
    },
  ],
};
