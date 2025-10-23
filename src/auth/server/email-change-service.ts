import { logger } from '@ycore/forge/logger';
import { err, flattenError, isError, ok, type Result } from '@ycore/forge/result';
import { getKVStore, type KVBindings } from '@ycore/forge/services';
import type { RouterContextProvider } from 'react-router';

import { sendMail } from '../../email/server';
import { createEmailChangeNotificationTemplate } from '../../email/templates/email-change-notification';
import { createEmailChangeVerificationTemplate } from '../../email/templates/email-change-verification';
import { createVerificationCode } from './totp-service';
import { sendVerificationEmail } from './verification-service';

/**
 * Pending email change request structure
 */
export interface PendingEmailChange {
  userId: string;
  oldEmail: string;
  newEmail: string;
  requestedAt: number;
}

/**
 * Get KV key for pending email change
 */
function getEmailChangeKey(userId: string): string {
  return `email_change:${userId}`;
}

/**
 * Create a pending email change request
 * Stores the request in KV with TTL matching verification code expiry
 */
export async function createEmailChangeRequest(
  userId: string,
  oldEmail: string,
  newEmail: string,
  context: Readonly<RouterContextProvider>,
  kvBinding: string,
  expirationTtl = 480 // 8 minutes (matches TOTP expiry)
): Promise<Result<void>> {
  try {
    const kv = getKVStore(context, kvBinding as KVBindings);

    if (!kv) {
      logger.error('email_change_request_kv_not_found', { userId, kvBinding });
      return err('KV storage not configured');
    }

    const pendingChange: PendingEmailChange = {
      userId,
      oldEmail,
      newEmail,
      requestedAt: Date.now(),
    };

    await kv.put(getEmailChangeKey(userId), JSON.stringify(pendingChange), {
      expirationTtl,
    });

    logger.info('email_change_request_created', {
      userId,
      oldEmail,
      newEmail,
      expirationTtl,
    });

    return ok(undefined);
  } catch (error) {
    logger.error('email_change_request_creation_failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return err('Failed to create email change request', { error });
  }
}

/**
 * Get pending email change request for a user
 * Returns null if no pending request exists
 */
export async function getEmailChangeRequest(userId: string, context: Readonly<RouterContextProvider>, kvBinding: string): Promise<Result<PendingEmailChange | null>> {
  try {
    const kv = getKVStore(context, kvBinding as KVBindings);

    if (!kv) {
      logger.error('email_change_request_kv_not_found', { userId, kvBinding });
      return err('KV storage not configured');
    }

    const value = await kv.get(getEmailChangeKey(userId), 'text');

    if (!value) {
      return ok(null);
    }

    const pendingChange = JSON.parse(value) as PendingEmailChange;

    logger.debug('email_change_request_retrieved', {
      userId,
      newEmail: pendingChange.newEmail,
    });

    return ok(pendingChange);
  } catch (error) {
    logger.error('email_change_request_retrieval_failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return err('Failed to retrieve email change request', { error });
  }
}

/**
 * Delete pending email change request
 * Used after successful completion or cancellation
 */
export async function deleteEmailChangeRequest(userId: string, context: Readonly<RouterContextProvider>, kvBinding: string): Promise<Result<void>> {
  try {
    const kv = getKVStore(context, kvBinding as KVBindings);

    if (!kv) {
      logger.error('email_change_request_kv_not_found', { userId, kvBinding });
      return err('KV storage not configured');
    }

    await kv.delete(getEmailChangeKey(userId));

    logger.info('email_change_request_deleted', { userId });

    return ok(undefined);
  } catch (error) {
    logger.error('email_change_request_deletion_failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return err('Failed to delete email change request', { error });
  }
}

/**
 * Send notification to old email address about email change request
 * Does NOT include a verification code - just informational
 */
export async function sendEmailChangeNotification(
  oldEmail: string,
  newEmail: string,
  context: Readonly<RouterContextProvider>,
): Promise<Result<void>> {
  try {
    // Create email content
    const emailContent = createEmailChangeNotificationTemplate({ oldEmail, newEmail });

    // Send email using centralized service (handles provider setup automatically)
    const sendResult = await sendMail(context, {
      to: oldEmail,
      template: emailContent,
    });

    if (isError(sendResult)) {
      logger.error('email_change_notification_send_failed', {
        oldEmail,
        newEmail,
        error: flattenError(sendResult),
      });
      return sendResult;
    }

    logger.info('email_change_notification_sent', { oldEmail, newEmail });
    return ok(undefined);
  } catch (error) {
    logger.error('email_change_notification_unexpected_error', {
      oldEmail,
      newEmail,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return err('Failed to send email change notification', { error });
  }
}

/**
 * Send email change verification email with custom template
 * Generates TOTP code and creates custom email template with email change context
 */
async function sendEmailChangeVerification(
  newEmail: string,
  oldEmail: string,
  context: Readonly<RouterContextProvider>,
  verificationUrl?: string,
): Promise<Result<void>> {
  try {
    // Generate TOTP code
    const codeResult = await createVerificationCode(newEmail, 'email-change', context, { oldEmail, newEmail });

    if (isError(codeResult)) {
      logger.error('email_change_verification_code_generation_failed', {
        newEmail,
        oldEmail,
        error: flattenError(codeResult),
      });
      return codeResult;
    }

    const code = codeResult;

    // Create custom email template with code and email change context
    const customTemplate = createEmailChangeVerificationTemplate({
      code,
      oldEmail,
      newEmail,
      verificationUrl,
    });

    // Send verification email with custom template
    const sendResult = await sendVerificationEmail({
      email: newEmail,
      purpose: 'email-change',
      metadata: { oldEmail, newEmail },
      context,
      customTemplate,
      verificationUrl,
    });

    if (isError(sendResult)) {
      logger.error('email_change_verification_send_failed', {
        newEmail,
        oldEmail,
        error: flattenError(sendResult),
      });
      return sendResult;
    }

    logger.info('email_change_verification_sent', { newEmail, oldEmail });
    return ok(undefined);
  } catch (error) {
    logger.error('email_change_verification_unexpected_error', {
      newEmail,
      oldEmail,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return err('Failed to send email change verification', { error });
  }
}

/**
 * Orchestrate complete email change request flow
 * 1. Create pending change in KV
 * 2. Send verification code to new email
 * 3. Send notification to old email
 */
export async function requestEmailChange(
  userId: string,
  oldEmail: string,
  newEmail: string,
  context: Readonly<RouterContextProvider>,
  kvBinding: string,
  verificationUrl?: string,
): Promise<Result<void>> {
  // Create pending change request
  const createResult = await createEmailChangeRequest(userId, oldEmail, newEmail, context, kvBinding);

  if (isError(createResult)) {
    return createResult;
  }

  // Send verification code to new email with custom template
  const verificationResult = await sendEmailChangeVerification(newEmail, oldEmail, context, verificationUrl);

  if (isError(verificationResult)) {
    // Clean up pending request if verification email fails
    await deleteEmailChangeRequest(userId, context, kvBinding);
    return verificationResult;
  }

  // Send notification to old email (non-blocking - don't fail if this fails)
  const notificationResult = await sendEmailChangeNotification(oldEmail, newEmail, context);

  if (isError(notificationResult)) {
    // Log warning but don't fail the request
    logger.warning('email_change_old_email_notification_failed', {
      userId,
      oldEmail,
      newEmail,
      error: flattenError(notificationResult),
    });
  }

  logger.info('email_change_request_completed', { userId, oldEmail, newEmail });

  return ok(undefined);
}
