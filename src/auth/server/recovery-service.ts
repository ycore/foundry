import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, type Result } from '@ycore/forge/result';
import type { RouterContextProvider } from 'react-router';

import { createRecoveryVerificationTemplate } from '../../email/templates/recovery-verification';
import type { User } from '../schema';
import { getAuthRepository } from './repository';
import { createVerificationCode } from './totp-service';
import { sendVerificationEmail } from './verification-service';

/**
 * Send recovery verification email with custom template
 * Combines security notification + verification code in a single email
 */
async function sendRecoveryVerification(
  email: string,
  context: Readonly<RouterContextProvider>,
  verificationUrl?: string,
): Promise<Result<void>> {
  try {
    // Generate TOTP code
    const codeResult = await createVerificationCode(email, 'recovery', context, { email });

    if (isError(codeResult)) {
      logger.error('recovery_verification_code_generation_failed', {
        email,
        error: flattenError(codeResult),
      });
      return codeResult;
    }

    const code = codeResult;

    // Create custom email template with code and recovery context
    const customTemplate = createRecoveryVerificationTemplate({
      code,
      email,
      verificationUrl,
    });

    // Send verification email with custom template
    const sendResult = await sendVerificationEmail({
      email,
      purpose: 'recovery',
      metadata: { email },
      context,
      customTemplate,
      verificationUrl,
    });

    if (isError(sendResult)) {
      logger.error('recovery_verification_send_failed', {
        email,
        error: flattenError(sendResult),
      });
      return sendResult;
    }

    logger.info('recovery_verification_sent', { email });
    return ok(undefined);
  } catch (error) {
    logger.error('recovery_verification_unexpected_error', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return err('Failed to send recovery verification', { error });
  }
}

/**
 * Orchestrate complete account recovery request flow
 * 1. Update user status to 'unrecovered'
 * 2. Send combined recovery verification email (notification + verification code)
 *
 * Returns the user object if email exists, null otherwise (for session creation)
 * Email configuration is automatically retrieved from context (requires email middleware).
 */
export async function requestAccountRecovery(
  email: string,
  context: Readonly<RouterContextProvider>,
  verificationUrl?: string,
): Promise<Result<User | null>> {
  const repository = getAuthRepository(context);

  // Get user by email
  const userResult = await repository.getUserByEmail(email);

  if (isError(userResult)) {
    // Don't reveal if email exists - log internally but return null
    logger.info('recovery_request_email_not_found', { email });
    return ok(null);
  }

  const user = userResult;

  // Update user status to unrecovered
  const statusUpdateResult = await repository.updateUserStatus(user.id, 'unrecovered');

  if (isError(statusUpdateResult)) {
    logger.error('recovery_request_status_update_failed', {
      userId: user.id,
      email,
      error: flattenError(statusUpdateResult),
    });
    return statusUpdateResult;
  }

  // Send combined recovery verification email (notification + code in one email)
  const verificationResult = await sendRecoveryVerification(email, context, verificationUrl);

  if (isError(verificationResult)) {
    logger.error('recovery_request_verification_email_failed', {
      userId: user.id,
      email,
      error: flattenError(verificationResult),
    });
    // Revert status update on failure
    await repository.updateUserStatus(user.id, user.status);
    return verificationResult;
  }

  logger.info('recovery_request_completed', { userId: user.id, email });

  // Return updated user with unrecovered status for session creation
  return ok(statusUpdateResult);
}
