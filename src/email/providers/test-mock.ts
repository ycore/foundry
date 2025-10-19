import { logger } from '@ycore/forge/logger';
import type { Result } from '@ycore/forge/result';
import { err, tryCatch } from '@ycore/forge/result';
import type { EmailProvider, SendEmailOptions } from '../@types/email.types';

/**
 * Test Mock Email Provider
 * Enhanced mock provider for testing that tracks sent emails and allows failure simulation
 */
export class TestMockEmailProvider implements EmailProvider {
  private static sentEmails: SendEmailOptions[] = [];
  private static shouldFail = false;
  private static failureReason = 'Simulated email failure';

  async sendEmail(options: SendEmailOptions): Promise<Result<void>> {
    const { to, from, template } = options;

    if (!from) {
      return err('From address is required');
    }

    // Store email for test verification (deep copy to prevent mutation)
    TestMockEmailProvider.sentEmails.push({
      apiKey: options.apiKey,
      to,
      from,
      template: {
        subject: template.subject,
        html: template.html,
        text: template.text,
      },
    });

    // Simulate failure if configured
    if (TestMockEmailProvider.shouldFail) {
      return err(TestMockEmailProvider.failureReason);
    }

    return tryCatch(async () => {
      // Faster delay for tests (10ms vs 100ms)
      await new Promise(resolve => setTimeout(resolve, 10));

      logger.debug({
        event: 'email_test_mock_sent',
        provider: 'test-mock',
        from,
        to,
        subject: template.subject,
        textLength: template.text.length,
        htmlLength: template.html.length,
      });

      return; // Success - void return
    }, 'Failed to send test mock email');
  }

  // Test utility methods
  static getSentEmails(): SendEmailOptions[] {
    return [...TestMockEmailProvider.sentEmails]; // Return copy to prevent mutation
  }

  static getLastSentEmail(): SendEmailOptions | undefined {
    const lastEmail = TestMockEmailProvider.sentEmails[TestMockEmailProvider.sentEmails.length - 1];
    if (!lastEmail) {
      return undefined;
    }
    // Return deep copy to prevent mutation
    return {
      apiKey: lastEmail.apiKey,
      to: lastEmail.to,
      from: lastEmail.from,
      template: {
        subject: lastEmail.template.subject,
        html: lastEmail.template.html,
        text: lastEmail.template.text,
      },
    };
  }

  static getEmailCount(): number {
    return TestMockEmailProvider.sentEmails.length;
  }

  static findEmailByTo(to: string): SendEmailOptions | undefined {
    return TestMockEmailProvider.sentEmails.find(email => email.to === to);
  }

  static findEmailsBySubject(subject: string): SendEmailOptions[] {
    return TestMockEmailProvider.sentEmails.filter(email => email.template.subject.includes(subject));
  }

  static clearSentEmails(): void {
    TestMockEmailProvider.sentEmails = [];
  }

  static simulateFailure(reason = 'Simulated email failure'): void {
    TestMockEmailProvider.shouldFail = true;
    TestMockEmailProvider.failureReason = reason;
  }

  static resetToSuccess(): void {
    TestMockEmailProvider.shouldFail = false;
    TestMockEmailProvider.failureReason = 'Simulated email failure';
  }

  static reset(): void {
    TestMockEmailProvider.clearSentEmails();
    TestMockEmailProvider.resetToSuccess();
  }

  static getFailureState(): { shouldFail: boolean; reason: string } {
    return {
      shouldFail: TestMockEmailProvider.shouldFail,
      reason: TestMockEmailProvider.failureReason,
    };
  }

  // Assertion helpers for tests
  static assertEmailSent(to: string): SendEmailOptions {
    const email = TestMockEmailProvider.findEmailByTo(to);
    if (!email) {
      throw new Error(`Expected email to be sent to ${to}, but no email was found`);
    }
    return email;
  }

  static assertEmailCount(expectedCount: number): void {
    const actualCount = TestMockEmailProvider.getEmailCount();
    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} emails to be sent, but ${actualCount} were sent`);
    }
  }

  static assertNoEmailsSent(): void {
    TestMockEmailProvider.assertEmailCount(0);
  }
}
