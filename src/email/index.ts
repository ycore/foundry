export type { EmailConfig, EmailProvider, EmailProviderConfig, EmailProviders, EmailSendResult, EmailTemplate, SendEmailOptions, SendMailOptions, TotpEmailData } from './@types/email.types';
export { defaultEmailConfig } from './email.config';
export { emailContext } from './email.context';
export { createEmailProvider, getEmailProviderNames, getProviderConfig, getSupportedProviders, isValidProvider } from './email-provider';
export { EmailSchema } from './email-validator';
export { createLocalDevEmailProvider } from './providers/local-dev';
export { createMailChannelsEmailProvider } from './providers/mailchannels';
export { createResendEmailProvider } from './providers/resend';
export {
  assertTestEmailCount,
  assertTestEmailSent,
  assertTestNoEmailsSent,
  clearTestSentEmails,
  createTestMockEmailProvider,
  findTestEmailByTo,
  findTestEmailsBySubject,
  getTestEmailCount,
  getTestEmailFailureState,
  getTestLastSentEmail,
  getTestSentEmails,
  resetTestEmailProvider,
  resetTestEmailToSuccess,
  simulateTestEmailFailure,
  type StoredTestEmail,
} from './providers/test-mock';
export { type TotpContent, TotpEmailTemplate, type TotpRepository, type TotpTemplateData, type VerificationPurpose, totpRepository } from './templates/auth-totp';
export { type EmailChangeNotificationData, EmailChangeNotificationTemplate } from './templates/email-change-notification';
export { type EmailChangeVerificationData, EmailChangeVerificationTemplate } from './templates/email-change-verification';
export { emailTailwindConfig } from './templates/email-tailwind.config';
export { type MinimalEmailData, MinimalEmailTemplate } from './templates/minimal-template';
export { type MockEmailData, MockEmailTemplate } from './templates/mock-template';
export { type RecoveryVerificationData, RecoveryVerificationTemplate } from './templates/recovery-verification';
