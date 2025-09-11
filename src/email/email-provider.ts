import type { AppError, AppResult } from '@ycore/forge/result';
import { createAppError, returnFailure, returnSuccess } from '@ycore/forge/result';
import type { EmailConfig, EmailProvider, EmailProviderConfig, EmailProviders } from './@types/email.types';
import { MailChannelsEmailProvider } from './providers/mailchannels';
import { MockEmailProvider } from './providers/mock';
import { ResendEmailProvider } from './providers/resend';

const providerRegistry: Record<EmailProviders, () => EmailProvider> = {
  resend: () => new ResendEmailProvider(),
  mock: () => new MockEmailProvider(),
  mailchannels: () => new MailChannelsEmailProvider(),
};

export function createEmailProvider(providerName: string): AppResult<EmailProvider, AppError> {
  if (!isValidProvider(providerName)) {
    return returnFailure(createAppError(`Unsupported email provider: ${providerName}`));
  }

  try {
    const factory = providerRegistry[providerName];
    return returnSuccess(factory());
  } catch (error) {
    return returnFailure(createAppError(`Failed to create email provider: ${error instanceof Error ? error.message : 'Unknown error'}`, undefined, error instanceof Error ? error : undefined));
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
