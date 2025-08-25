import type { ErrorCollection, TypedResult } from '@ycore/forge/error';
import { returnFailure, returnSuccess } from '@ycore/forge/error';
import type { EmailConfig, EmailProvider, EmailProviderConfig, EmailProviders } from './@types/email.types';
import { MailChannelsEmailProvider } from './providers/mailchannels';
import { MockEmailProvider } from './providers/mock';
import { ResendEmailProvider } from './providers/resend';

const providerRegistry: Record<EmailProviders, () => EmailProvider> = {
  resend: () => new ResendEmailProvider(),
  mock: () => new MockEmailProvider(),
  mailchannels: () => new MailChannelsEmailProvider(),
};

export function createEmailProvider(providerName: string): TypedResult<EmailProvider, ErrorCollection> {
  if (!isValidProvider(providerName)) {
    return returnFailure([{ messages: [`Unsupported email provider: ${providerName}`] }]);
  }

  try {
    const factory = providerRegistry[providerName];
    return returnSuccess(factory());
  } catch (error) {
    return returnFailure([{ messages: [`Failed to create email provider: ${error instanceof Error ? error.message : 'Unknown error'}`] }]);
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
