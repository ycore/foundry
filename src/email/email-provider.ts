import type { EmailProvider, EmailProviders } from './@types/email.types';
import { MailChannelsEmailProvider } from './providers/mailchannels';
import { MockEmailProvider } from './providers/mock';
import { ResendEmailProvider } from './providers/resend';

const providerRegistry: Record<EmailProviders, () => EmailProvider> = {
  resend: () => new ResendEmailProvider(),
  mock: () => new MockEmailProvider(),
  mailchannels: () => new MailChannelsEmailProvider(),
};

export function createEmailProvider(providerName: string): EmailProvider {
  if (!isValidProvider(providerName)) {
    throw new Error(`Unsupported email provider: ${providerName}`);
  }

  const factory = providerRegistry[providerName];
  return factory();
}

export function isValidProvider(providerName: string): providerName is EmailProviders {
  return providerName in providerRegistry;
}

export function getSupportedProviders(): EmailProviders[] {
  return Object.keys(providerRegistry) as EmailProviders[];
}
