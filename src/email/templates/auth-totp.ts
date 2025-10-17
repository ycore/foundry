import type { EmailTemplate, TotpEmailData } from '../@types/email.types';

export type VerificationPurpose = 'signup' | 'passkey-add' | 'passkey-delete' | 'email-change' | 'account-delete' | 'recovery';

interface TotpTemplateData extends TotpEmailData {
  purpose: VerificationPurpose;
}

const purposeContent = {
  signup: {
    title: 'Verify Your Email',
    message: 'Thank you for signing up! Please verify your email address to complete your registration.',
    action: 'verify your email',
  },
  'passkey-add': {
    title: 'Confirm Adding Passkey',
    message: 'You are about to add a new passkey to your account. Please verify this action.',
    action: 'confirm adding the passkey',
  },
  'passkey-delete': {
    title: 'Confirm Passkey Removal',
    message: 'You are about to remove a passkey from your account. Please verify this action.',
    action: 'confirm removing the passkey',
  },
  'email-change': {
    title: 'Verify New Email Address',
    message: 'You requested to change your email address. Please verify your new email.',
    action: 'verify your new email address',
  },
  'account-delete': {
    title: 'Confirm Account Deletion',
    message: 'You requested to delete your account. This action cannot be undone. Please confirm.',
    action: 'confirm account deletion',
  },
  recovery: {
    title: 'Account Recovery',
    message: 'You requested account recovery. Use this code to regain access to your account.',
    action: 'recover your account',
  },
};

/**
 * Authentication TOTP Email Template
 * Email template for TOTP verification codes with purpose-specific content
 */
export function createTotpTemplate(data: TotpTemplateData): EmailTemplate {
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
          ${purpose === 'account-delete' ? '.container { background: #fff3cd; padding: 20px; border-radius: 8px; border: 2px solid #ffc107; }' : ''}
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
            <p>If you didn't request this code, please ignore this email${purpose === 'account-delete' || purpose === 'passkey-delete' ? ' and consider securing your account' : ''}.</p>
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

If you didn't request this code, please ignore this email${purpose === 'account-delete' || purpose === 'passkey-delete' ? ' and consider securing your account' : ''}.
  `.trim();

  return {
    subject,
    html,
    text,
  };
}
