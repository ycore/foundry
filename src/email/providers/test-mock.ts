import { logger } from '@ycore/forge/logger';
import { err } from '@ycore/forge/result';
import type { EmailProvider } from '../@types/email.types';
import { createEmailProviderBase, EMAIL_PROVIDER_DELAYS } from './base-provider';

/**
 * Stored email metadata for test verification (excludes sensitive data)
 */
export interface StoredTestEmail {
  to: string;
  from: string;
  template: {
    subject: string;
    html: string;
    text: string;
  };
}

/**
 * Module-level state for test email tracking
 * Isolated from production code for security
 */
let sentEmails: StoredTestEmail[] = [];
let shouldFail = false;
let failureReason = 'Simulated email failure';

/**
 * Test Mock Email Provider
 * Enhanced mock provider for testing that tracks sent emails and allows failure simulation
 */
export function createTestMockEmailProvider(): EmailProvider {
  return {
    async sendEmail(options) {
      const { to, from, template } = options;

      if (!from) {
        return err('From address is required');
      }

      // Store email metadata for test verification (excludes sensitive apiKey)
      sentEmails.push({
        to,
        from,
        template: {
          subject: template.subject,
          html: template.html,
          text: template.text,
        },
      });

      // Simulate failure if configured
      if (shouldFail) {
        return err(failureReason);
      }

      // Use base provider for consistent behavior
      const baseProvider = createEmailProviderBase('test-mock', async (opts) => {
        await new Promise((resolve) => setTimeout(resolve, EMAIL_PROVIDER_DELAYS.TEST_MOCK));

        logger.debug('email_test_mock_sent', {
          provider: 'test-mock',
          from: opts.from,
          to: opts.to,
          subject: opts.template.subject,
          textLength: opts.template.text.length,
          htmlLength: opts.template.html.length,
        });
      });

      return baseProvider.sendEmail(options);
    },
  };
}

// ============================================================================
// Test Utility Functions
// ============================================================================

/**
 * Get all sent emails (returns copy to prevent mutation)
 */
export function getTestSentEmails(): StoredTestEmail[] {
  return sentEmails.map((email) => ({
    to: email.to,
    from: email.from,
    template: {
      subject: email.template.subject,
      html: email.template.html,
      text: email.template.text,
    },
  }));
}

/**
 * Get the most recently sent email
 */
export function getTestLastSentEmail(): StoredTestEmail | undefined {
  const lastEmail = sentEmails[sentEmails.length - 1];
  if (!lastEmail) {
    return undefined;
  }

  return {
    to: lastEmail.to,
    from: lastEmail.from,
    template: {
      subject: lastEmail.template.subject,
      html: lastEmail.template.html,
      text: lastEmail.template.text,
    },
  };
}

/**
 * Get count of sent emails
 */
export function getTestEmailCount(): number {
  return sentEmails.length;
}

/**
 * Find email sent to specific recipient
 */
export function findTestEmailByTo(to: string): StoredTestEmail | undefined {
  return sentEmails.find((email) => email.to === to);
}

/**
 * Find all emails with subject containing search string
 */
export function findTestEmailsBySubject(subject: string): StoredTestEmail[] {
  return sentEmails.filter((email) => email.template.subject.includes(subject));
}

/**
 * Clear all sent emails
 */
export function clearTestSentEmails(): void {
  sentEmails = [];
}

/**
 * Configure provider to simulate failures
 */
export function simulateTestEmailFailure(reason = 'Simulated email failure'): void {
  shouldFail = true;
  failureReason = reason;
}

/**
 * Reset provider to success mode
 */
export function resetTestEmailToSuccess(): void {
  shouldFail = false;
  failureReason = 'Simulated email failure';
}

/**
 * Full reset - clears emails and resets failure state
 */
export function resetTestEmailProvider(): void {
  clearTestSentEmails();
  resetTestEmailToSuccess();
}

/**
 * Get current failure configuration
 */
export function getTestEmailFailureState(): { shouldFail: boolean; reason: string } {
  return {
    shouldFail,
    reason: failureReason,
  };
}

// ============================================================================
// Test Assertion Helpers
// ============================================================================

/**
 * Assert that an email was sent to a specific recipient
 * Throws if email not found
 */
export function assertTestEmailSent(to: string): StoredTestEmail {
  const email = findTestEmailByTo(to);
  if (!email) {
    throw new Error(`Expected email to be sent to ${to}, but no email was found`);
  }
  return email;
}

/**
 * Assert specific number of emails were sent
 */
export function assertTestEmailCount(expectedCount: number): void {
  const actualCount = getTestEmailCount();
  if (actualCount !== expectedCount) {
    throw new Error(`Expected ${expectedCount} emails to be sent, but ${actualCount} were sent`);
  }
}

/**
 * Assert no emails were sent
 */
export function assertTestNoEmailsSent(): void {
  assertTestEmailCount(0);
}
