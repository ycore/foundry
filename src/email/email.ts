import type { ErrorCollection } from '@ycore/forge/error';
import type { TypedResult } from '@ycore/forge/http';
import type { SendEmailOptions } from './@types/email.types';
import { ResendEmailProvider } from './providers/resend';

const emailProvider = new ResendEmailProvider();

/**
 * Send email using configured provider
 */
export async function sendEmail(options: SendEmailOptions): Promise<TypedResult<void, ErrorCollection>> {
  return emailProvider.sendEmail(options);
}
