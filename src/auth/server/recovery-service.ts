import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, type Result } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';

import { sendMail } from '../../email/server';
import { renderEmailTemplate } from '../../email/server/render-email';
import type { User } from '../schema';
import { RecoveryVerificationTemplate } from '../templates/recovery-verification';
import { getAuthRepository } from './repository';
import { createVerificationCode } from './totp-service';

/**
 * Send recovery verification email with custom template
 * Generates TOTP code and sends custom recovery verification email
 */
async function sendRecoveryVerification(email: string, context: Readonly<RouterContextProvider>, verificationUrl?: string): Promise<Result<void>> {
  try {
    // Generate TOTP code
    const codeResult = await createVerificationCode(email, 'recovery', context, { email });

    if (isError(codeResult)) {
      logger.error('recovery_verification_code_generation_failed', { email, error: flattenError(codeResult) });
      return codeResult;
    }

    const code = codeResult;

    // Create custom recovery verification email template
    const emailTemplate = await renderEmailTemplate(RecoveryVerificationTemplate, {
      code,
      email,
      verificationUrl,
    });

    // Send email directly using centralized service
    const sendResult = await sendMail(context, { to: email, template: emailTemplate });

    if (isError(sendResult)) {
      logger.error('recovery_verification_send_failed', { email, error: flattenError(sendResult) });
      return sendResult;
    }

    return ok(undefined);
  } catch (error) {
    logger.error('recovery_verification_unexpected_error', { email, error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined });
    return err('Failed to send recovery verification', { error });
  }
}

/**
 * Orchestrate account recovery request flow
 */
export async function requestAccountRecovery(email: string, context: Readonly<RouterContextProvider>, verificationUrl?: string): Promise<Result<User | null>> {
  const repository = getAuthRepository(context);
  const userResult = await repository.getUserByEmail(email);

  if (isError(userResult)) {
    logger.error('recovery_request_email_not_found', { email });
    return ok(null);
  }

  const user = userResult;
  const statusUpdateResult = await repository.updateUserStatus(user.id, 'unrecovered');

  if (isError(statusUpdateResult)) {
    logger.error('recovery_request_status_update_failed', { userId: user.id, email, error: flattenError(statusUpdateResult) });
    return statusUpdateResult;
  }

  const verificationResult = await sendRecoveryVerification(email, context, verificationUrl);

  if (isError(verificationResult)) {
    logger.error('recovery_request_verification_email_failed', { userId: user.id, email, error: flattenError(verificationResult) });
    await repository.updateUserStatus(user.id, user.status);
    return verificationResult;
  }

  return ok(statusUpdateResult);
}
