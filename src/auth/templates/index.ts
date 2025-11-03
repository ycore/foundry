/**
 * Auth Email Templates
 * Exports all authentication-related email templates and their types
 */

export type { TotpContent, TotpRepository, TotpTemplateData, VerificationPurpose } from './auth-totp';
export { TotpEmailTemplate, totpRepository } from './auth-totp';
export type { EmailChangeNotificationData } from './email-change-notification';
export { EmailChangeNotificationTemplate } from './email-change-notification';
export type { EmailChangeVerificationData } from './email-change-verification';
export { EmailChangeVerificationTemplate } from './email-change-verification';
export type { RecoveryVerificationData } from './recovery-verification';
export { RecoveryVerificationTemplate } from './recovery-verification';
