import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, type Result } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';

import type { EmailTemplate } from '../../email/@types/email.types';
import { sendMail } from '../../email/server';
import { createTotpTemplate } from '../../email/templates/auth-totp';
import { createVerificationCode, type VerificationPurpose } from './totp-service';

export interface SendVerificationOptions {
  email: string;
  purpose: VerificationPurpose;
  metadata?: Record<string, unknown>;
  context: Readonly<RouterContextProvider>;
  customTemplate?: EmailTemplate;
  verificationUrl?: string;
}

/**
 * Send verification email with TOTP code
 * Orchestrates code generation and email sending
 */
export async function sendVerificationEmail(options: SendVerificationOptions): Promise<Result<void>> {
  const { email, purpose, metadata, context, customTemplate, verificationUrl } = options;

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

    // Create email content - use custom template if provided, otherwise use default TOTP template
    const emailContent = customTemplate || createTotpTemplate({ code, purpose });

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
