import type { AppError, AppResult } from '@ycore/forge/result';
import type { SendEmailOptions } from './@types/email.types';
import { ResendEmailProvider } from './providers/resend';

const emailProvider = new ResendEmailProvider();

/**
 * Send email using configured provider
 */
export async function sendEmail(options: SendEmailOptions): Promise<AppResult<void, AppError>> {
  return emailProvider.sendEmail(options);
}
