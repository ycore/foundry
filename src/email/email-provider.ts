import type { Result } from '@ycore/forge/result';
import { err } from '@ycore/forge/result';
import type { EmailConfig, EmailProvider, EmailProviderConfig, EmailProviders } from './@types/email.types';
import { MailChannelsEmailProvider } from './providers/mailchannels';
import { MockEmailProvider } from './providers/mock';
import { ResendEmailProvider } from './providers/resend';
import { TestMockEmailProvider } from './providers/test-mock';

const providerRegistry: Record<EmailProviders, () => EmailProvider> = {
  resend: () => new ResendEmailProvider(),
  mock: () => new MockEmailProvider(),
  mailchannels: () => new MailChannelsEmailProvider(),
  'test-mock': () => new TestMockEmailProvider(),
};

export function createEmailProvider(providerName: string): Result<EmailProvider> {
  if (!isValidProvider(providerName)) {
    return err(`Unsupported email provider: ${providerName}`);
  }

  try {
    const factory = providerRegistry[providerName];
    return factory();
  } catch (error) {
    return err(
      `Failed to create email provider: ${providerName}`,
      undefined,
      { cause: error }
    );
  }
}

export function isValidProvider(providerName: string): providerName is EmailProviders {
  return providerName in providerRegistry;
}

export function getSupportedProviders(): EmailProviders[] {
  return Object.keys(providerRegistry) as EmailProviders[];
}

export function getEmailProviderNames(emailConfig: EmailConfig): string[] {
  return emailConfig.providers.map(provider => provider.name);
}

export function getProviderConfig(emailConfig: EmailConfig, providerName: string): EmailProviderConfig | undefined {
  return emailConfig.providers.find(provider => provider.name === providerName);
}
