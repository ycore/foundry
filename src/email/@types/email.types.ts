import type { Result } from '@ycore/forge/result';
import type { SecretBindings } from '@ycore/forge/services';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailOptions {
  apiKey: string;
  from: string;
  to: string;
  template: EmailTemplate;
}

export interface EmailProvider {
  sendEmail(options: SendEmailOptions): Promise<Result<void>>;
}

export interface TotpEmailData {
  code: string;
}

export interface MockEmailData {
  subject: string;
  message: string;
  recipientName?: string;
}

export interface EmailProviderConfig {
  name: EmailProviders;
  sendFrom: string;
  apiKey?: SecretBindings;
}

export type EmailProviders = 'local-dev' | 'mailchannels' | 'resend' | 'test-mock';

export interface EmailConfig {
  active: EmailProviders | null;
  providers: EmailProviderConfig[];
}

export interface EmailSendResult {
  to: string;
  provider: string;
  message: string;
}

export interface SendMailOptions {
  to: string;
  template: EmailTemplate;
  from?: string;
  provider?: EmailProviders;
  apiKey?: string;
}
