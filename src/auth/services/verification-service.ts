import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, type Result } from '@ycore/forge/result';
import { getBindings } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';

import type { EmailConfig } from '../../email/@types/email.types';
import { createEmailProvider, getProviderConfig } from '../../email/email-provider';
import { createTotpTemplate } from '../../email/templates/auth-totp';
import { createVerificationCode, type VerificationPurpose } from './totp-service';

export interface SendVerificationOptions {
  email: string;
  purpose: VerificationPurpose;
  metadata?: Record<string, unknown>;
  context: Readonly<RouterContextProvider>;
  emailConfig: EmailConfig;
}

/**
 * Send verification email with TOTP code
 * Orchestrates code generation and email sending
 */
export async function sendVerificationEmail(options: SendVerificationOptions): Promise<Result<void>> {
  const { email, purpose, metadata, context, emailConfig } = options;

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

    // Create email content
    const emailContent = createTotpTemplate({ code, purpose });

    // Get active email provider
    const activeProvider = emailConfig.active;

    if (!activeProvider) {
      logger.error('verification_email_no_provider', { email, purpose });
      return err('No active email provider configured');
    }

    const providerConfig = getProviderConfig(emailConfig, activeProvider);
    if (!providerConfig) {
      logger.error('verification_email_provider_config_missing', {
        email,
        purpose,
        provider: activeProvider,
      });
      return err(`Provider configuration not found for: ${activeProvider}`);
    }

    // Create email provider instance
    const emailProviderResult = createEmailProvider(activeProvider);
    if (isError(emailProviderResult)) {
      logger.error('verification_email_provider_creation_failed', {
        email,
        purpose,
        provider: activeProvider,
        error: flattenError(emailProviderResult),
      });
      return emailProviderResult;
    }

    // Get API key from environment using the configured secret key
    const bindings = getBindings(context);
    const apiKey = providerConfig.apiKey
      ? bindings[providerConfig.apiKey as keyof typeof bindings] as string | undefined
      : undefined;

    // Send email
    const sendResult = await emailProviderResult.sendEmail({
      apiKey: apiKey || '',
      to: email,
      from: providerConfig.sendFrom,
      template: {
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      },
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
