import type { AppError, AppResult } from '@ycore/forge/result';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailOptions {
  apiKey: string;
  to: string;
  from: string;
  template: EmailTemplate;
}

export interface EmailProvider {
  sendEmail(options: SendEmailOptions): Promise<AppResult<void, AppError>>;
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
  name: string;
  sendFrom: string;
}

export type EmailProviders = 'resend' | 'mock' | 'mailchannels';

export interface EmailConfig {
  active: EmailProviders | null;
  providers: EmailProviderConfig[];
}
