import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, type Result } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';

import { sendMail } from '../../email/server';
import { renderEmailTemplate } from '../../email/server/render-email';
import { TotpEmailTemplate } from '../templates/auth-totp';
import { createVerificationCode, type VerificationPurpose } from './totp-service';

export interface SendVerificationOptions {
  email: string;
  purpose: VerificationPurpose;
  metadata?: Record<string, unknown>;
  context: Readonly<RouterContextProvider>;
}

/**
 * Send verification email with TOTP code
 * Generates TOTP code and sends default TOTP template
 * For custom templates, use createVerificationCode + renderEmailTemplate + sendMail directly
 */
export async function sendVerificationEmail(options: SendVerificationOptions): Promise<Result<void>> {
  const { email, purpose, metadata, context } = options;

  try {
    // Generate TOTP code
    const codeResult = await createVerificationCode(email, purpose, context, metadata);

    if (isError(codeResult)) {
      logger.error('verification_email_code_generation_failed', {
        email,
        purpose,
        error: flattenError(codeResult),
      });
      return codeResult;
    }

    const code = codeResult;

    // Create default TOTP email template
    const emailContent = await renderEmailTemplate(TotpEmailTemplate, {
      code,
      purpose,
    });

    // Send email using centralized service (handles provider setup automatically)
    const sendResult = await sendMail(context, {
      to: email,
      template: emailContent,
    });

    if (isError(sendResult)) {
      logger.error('verification_email_send_failed', {
        email,
        purpose,
        error: flattenError(sendResult),
      });
      return sendResult;
    }

    logger.info('verification_email_sent', { email, purpose });
    return ok(undefined);
  } catch (error) {
    logger.error('verification_email_unexpected_error', {
      email,
      purpose,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return err('Failed to send verification email', { error });
  }
}
