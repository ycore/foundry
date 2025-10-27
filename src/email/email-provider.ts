import type { Result } from '@ycore/forge/result';
import { err, ok } from '@ycore/forge/result';
import type { EmailConfig, EmailProvider, EmailProviderConfig, EmailProviders } from './@types/email.types';
import { createLocalDevEmailProvider } from './providers/local-dev';
import { createMailChannelsEmailProvider } from './providers/mailchannels';
import { createResendEmailProvider } from './providers/resend';
import { createTestMockEmailProvider } from './providers/test-mock';

const providerRegistry: Record<EmailProviders, () => EmailProvider> = {
  'local-dev': createLocalDevEmailProvider,
  mailchannels: createMailChannelsEmailProvider,
  resend: createResendEmailProvider,
  'test-mock': createTestMockEmailProvider,
};

export function createEmailProvider(providerName: string): Result<EmailProvider> {
  if (!isValidProvider(providerName)) {
    return err(`Unsupported email provider: ${providerName}`);
  }

  try {
    const factory = providerRegistry[providerName];
    const provider = factory();
    return ok(provider);
  } catch (error) {
    return err(`Failed to create email provider: ${providerName}`, undefined, { cause: error });
  }
}

export function isValidProvider(providerName: string): providerName is EmailProviders {
  return providerName in providerRegistry;
}

export function getSupportedProviders(): EmailProviders[] {
  return Object.keys(providerRegistry) as EmailProviders[];
}

export function getEmailProviderNames(emailConfig: EmailConfig): EmailProviders[] {
  return emailConfig.providers.map(provider => provider.name);
}

export function getProviderConfig(emailConfig: EmailConfig, providerName: string): EmailProviderConfig | undefined {
  return emailConfig.providers.find(provider => provider.name === providerName);
}
