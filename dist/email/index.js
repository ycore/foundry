// src/email/providers/resend.ts
import { logger } from "@ycore/forge/logger";
import { err, tryCatch } from "@ycore/forge/result";

class ResendEmailProvider {
  async sendEmail(options) {
    const { apiKey, to, from, template } = options;
    if (!from) {
      return err("From address is required");
    }
    return tryCatch(async () => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from,
          to,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${response.status} ${error}`);
      }
      logger.debug({
        event: "email_sent_success",
        provider: "resend",
        to
      });
      return;
    }, "Failed to send email via Resend");
  }
}

// src/email/email.ts
var emailProvider = new ResendEmailProvider;
async function sendEmail(options) {
  return emailProvider.sendEmail(options);
}
// src/email/email.config.ts
var defaultEmailConfig = {
  active: "local-dev",
  providers: [
    {
      name: "resend",
      sendFrom: "noreply@example.com"
    },
    {
      name: "mailchannels",
      sendFrom: "noreply@example.com"
    },
    {
      name: "local-dev",
      sendFrom: "dev@localhost"
    }
  ]
};
// src/email/email.context.ts
import { createContext } from "react-router";
var emailContext = createContext(null);
// src/email/email-provider.ts
import { err as err5 } from "@ycore/forge/result";

// src/email/providers/local-dev.ts
import { logger as logger2 } from "@ycore/forge/logger";
import { err as err2, tryCatch as tryCatch2 } from "@ycore/forge/result";

class MockEmailProvider {
  async sendEmail(options) {
    const { to, from, template } = options;
    if (!from) {
      return err2("From address is required");
    }
    return tryCatch2(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      logger2.info({
        event: "local_dev_email_sent",
        provider: "local-dev",
        from,
        to,
        subject: template.subject,
        text: template.text
      });
      return;
    }, "Failed to send mock email");
  }
}

// src/email/providers/mailchannels.ts
import { logger as logger3 } from "@ycore/forge/logger";
import { err as err3, tryCatch as tryCatch3 } from "@ycore/forge/result";

class MailChannelsEmailProvider {
  apiUrl = "https://api.mailchannels.net/tx/v1/send";
  async sendEmail(options) {
    const { apiKey, to, from, template } = options;
    if (!from) {
      return err3("From address is required");
    }
    return tryCatch3(async () => {
      const payload = {
        personalizations: [
          {
            to: [{ email: to }]
          }
        ],
        from: { email: from },
        subject: template.subject,
        content: [
          { type: "text/plain", value: template.text },
          { type: "text/html", value: template.html }
        ]
      };
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MailChannels API error: ${response.status} ${errorText}`);
      }
      logger3.debug({
        event: "email_sent_success",
        provider: "mailchannels",
        to,
        subject: template.subject
      });
      return;
    }, "Failed to send email via MailChannels");
  }
}

// src/email/providers/test-mock.ts
import { logger as logger4 } from "@ycore/forge/logger";
import { err as err4, tryCatch as tryCatch4 } from "@ycore/forge/result";

class TestMockEmailProvider {
  static sentEmails = [];
  static shouldFail = false;
  static failureReason = "Simulated email failure";
  async sendEmail(options) {
    const { to, from, template } = options;
    if (!from) {
      return err4("From address is required");
    }
    TestMockEmailProvider.sentEmails.push({
      apiKey: options.apiKey,
      to,
      from,
      template: {
        subject: template.subject,
        html: template.html,
        text: template.text
      }
    });
    if (TestMockEmailProvider.shouldFail) {
      return err4(TestMockEmailProvider.failureReason);
    }
    return tryCatch4(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      logger4.debug({
        event: "email_test_mock_sent",
        provider: "test-mock",
        from,
        to,
        subject: template.subject,
        textLength: template.text.length,
        htmlLength: template.html.length
      });
      return;
    }, "Failed to send test mock email");
  }
  static getSentEmails() {
    return [...TestMockEmailProvider.sentEmails];
  }
  static getLastSentEmail() {
    const lastEmail = TestMockEmailProvider.sentEmails[TestMockEmailProvider.sentEmails.length - 1];
    if (!lastEmail) {
      return;
    }
    return {
      apiKey: lastEmail.apiKey,
      to: lastEmail.to,
      from: lastEmail.from,
      template: {
        subject: lastEmail.template.subject,
        html: lastEmail.template.html,
        text: lastEmail.template.text
      }
    };
  }
  static getEmailCount() {
    return TestMockEmailProvider.sentEmails.length;
  }
  static findEmailByTo(to) {
    return TestMockEmailProvider.sentEmails.find((email) => email.to === to);
  }
  static findEmailsBySubject(subject) {
    return TestMockEmailProvider.sentEmails.filter((email) => email.template.subject.includes(subject));
  }
  static clearSentEmails() {
    TestMockEmailProvider.sentEmails = [];
  }
  static simulateFailure(reason = "Simulated email failure") {
    TestMockEmailProvider.shouldFail = true;
    TestMockEmailProvider.failureReason = reason;
  }
  static resetToSuccess() {
    TestMockEmailProvider.shouldFail = false;
    TestMockEmailProvider.failureReason = "Simulated email failure";
  }
  static reset() {
    TestMockEmailProvider.clearSentEmails();
    TestMockEmailProvider.resetToSuccess();
  }
  static getFailureState() {
    return {
      shouldFail: TestMockEmailProvider.shouldFail,
      reason: TestMockEmailProvider.failureReason
    };
  }
  static assertEmailSent(to) {
    const email = TestMockEmailProvider.findEmailByTo(to);
    if (!email) {
      throw new Error(`Expected email to be sent to ${to}, but no email was found`);
    }
    return email;
  }
  static assertEmailCount(expectedCount) {
    const actualCount = TestMockEmailProvider.getEmailCount();
    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} emails to be sent, but ${actualCount} were sent`);
    }
  }
  static assertNoEmailsSent() {
    TestMockEmailProvider.assertEmailCount(0);
  }
}

// src/email/email-provider.ts
var providerRegistry = {
  "local-dev": () => new MockEmailProvider,
  mailchannels: () => new MailChannelsEmailProvider,
  resend: () => new ResendEmailProvider,
  "test-mock": () => new TestMockEmailProvider
};
function createEmailProvider(providerName) {
  if (!isValidProvider(providerName)) {
    return err5(`Unsupported email provider: ${providerName}`);
  }
  try {
    const factory = providerRegistry[providerName];
    return factory();
  } catch (error) {
    return err5(`Failed to create email provider: ${providerName}`, undefined, { cause: error });
  }
}
function isValidProvider(providerName) {
  return providerName in providerRegistry;
}
function getSupportedProviders() {
  return Object.keys(providerRegistry);
}
function getEmailProviderNames(emailConfig) {
  return emailConfig.providers.map((provider) => provider.name);
}
function getProviderConfig(emailConfig, providerName) {
  return emailConfig.providers.find((provider) => provider.name === providerName);
}
// src/email/email-validator.ts
import * as v from "valibot";
var EmailSchema = v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email(), v.maxLength(254));
// src/email/templates/auth-totp.ts
var purposeContent = {
  signup: {
    title: "Verify Your Email",
    message: "Thank you for signing up! Please verify your email address to complete your registration.",
    action: "verify your email"
  },
  "passkey-add": {
    title: "Confirm Adding Passkey",
    message: "You are about to add a new passkey to your account. Please verify this action.",
    action: "confirm adding the passkey"
  },
  "passkey-delete": {
    title: "Confirm Passkey Removal",
    message: "You are about to remove a passkey from your account. Please verify this action.",
    action: "confirm removing the passkey"
  },
  "email-change": {
    title: "Verify New Email Address",
    message: "You requested to change your email address. Please verify your new email.",
    action: "verify your new email address"
  },
  "account-delete": {
    title: "Confirm Account Deletion",
    message: "You requested to delete your account. This action cannot be undone. Please confirm.",
    action: "confirm account deletion"
  },
  recovery: {
    title: "Account Recovery",
    message: "You requested account recovery. Use this code to regain access to your account.",
    action: "recover your account"
  }
};
function createTotpTemplate(data) {
  const { code, purpose } = data;
  const content = purposeContent[purpose];
  const subject = content.title;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${content.title}</title>
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #333;
          }
          .header {
            text-align: center;
            padding: 40px 20px 20px;
          }
          .message {
            text-align: center;
            padding: 0 20px 20px;
            color: #666;
          }
          .code {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            margin: 20px;
            color: #495057;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            font-size: 14px;
          }
          ${purpose === "account-delete" ? ".container { background: #fff3cd; padding: 20px; border-radius: 8px; border: 2px solid #ffc107; }" : ""}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="message">
            <p>${content.message}</p>
          </div>

          <div class="code">${code}</div>

          <div class="footer">
            <p>This code will expire in <strong>8 minutes</strong>.</p>
            <p>If you didn't request this code, please ignore this email${purpose === "account-delete" || purpose === "passkey-delete" ? " and consider securing your account" : ""}.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  const text = `
${content.title}

${content.message}

Your verification code: ${code}

Use this code to ${content.action}.
This code will expire in 8 minutes.

If you didn't request this code, please ignore this email${purpose === "account-delete" || purpose === "passkey-delete" ? " and consider securing your account" : ""}.
  `.trim();
  return {
    subject,
    html,
    text
  };
}
// src/email/templates/minimal-template.ts
function createMinimalTemplate(data) {
  const { subject, message } = data;
  const html = `<p>${message}</p>`;
  const text = `${message}`.trim();
  return { subject, html, text };
}
// src/email/templates/mock-template.ts
function createMockTemplate(data) {
  const { subject, message, recipientName = "there" } = data;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #333;
          }
          .header {
            text-align: center;
            padding: 40px 20px 20px;
            border-bottom: 1px solid #e9ecef;
          }
          .content {
            padding: 30px 20px;
          }
          .message {
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
            color: #495057;
          }
          .footer {
            text-align: center;
            padding: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>

          <div class="content">
            <p>Hello ${recipientName},</p>
            
            <div class="message">
              ${message}
            </div>
            
            <p>Thank you for testing the Foundry email system!</p>
          </div>

          <div class="footer">
            <p>This is a test email sent from the Foundry system.</p>
            <p>If you received this email by mistake, please ignore it.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  const text = `
${subject}

Hello ${recipientName},

${message}

Thank you for testing the Foundry email system!

---
This is a test email sent from the Foundry system.
If you received this email by mistake, please ignore it.
  `.trim();
  return {
    subject,
    html,
    text
  };
}
export {
  sendEmail,
  isValidProvider,
  getSupportedProviders,
  getProviderConfig,
  getEmailProviderNames,
  emailContext,
  defaultEmailConfig,
  createTotpTemplate,
  createMockTemplate,
  createMinimalTemplate,
  createEmailProvider,
  TestMockEmailProvider,
  ResendEmailProvider,
  MockEmailProvider,
  MailChannelsEmailProvider,
  EmailSchema
};

//# debugId=8B8B79D678B2A0B664756E2164756E21
