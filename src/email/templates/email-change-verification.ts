import type { EmailTemplate } from '../@types/email.types';

export interface EmailChangeVerificationData {
  code: string;
  oldEmail: string;
  newEmail: string;
  verificationUrl?: string;
}

/**
 * Email Change Verification Template
 * Sent to the NEW email address with verification code and email change context
 * Combines notification + verification in a single email
 */
export function createEmailChangeVerificationTemplate(data: EmailChangeVerificationData): EmailTemplate {
  const { code, oldEmail, newEmail, verificationUrl } = data;

  const subject = 'Verify Your New Email Address';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your New Email Address</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
          }
          .header-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .message {
            background: white;
            padding: 30px 20px;
            border-left: 4px solid #667eea;
            margin-bottom: 20px;
          }
          .message p {
            margin: 10px 0;
            color: #333;
          }
          .email-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 12px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            word-break: break-all;
          }
          .email-box .label {
            font-weight: bold;
            color: #495057;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .email-box .value {
            color: #212529;
            font-size: 14px;
          }
          .code-section {
            background: #f8f9fa;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
          }
          .code-section h2 {
            color: #495057;
            font-size: 16px;
            margin: 0 0 15px 0;
          }
          .code {
            background: white;
            border: 2px solid #667eea;
            border-radius: 8px;
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 10px;
            padding: 20px;
            margin: 15px 0;
            color: #667eea;
            display: inline-block;
          }
          .url-section {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
          .url-section p {
            margin: 5px 0;
            color: #0c5460;
          }
          .url-section a {
            color: #004085;
            font-weight: bold;
            text-decoration: none;
          }
          .instructions {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .instructions h2 {
            color: #856404;
            font-size: 16px;
            margin: 0 0 10px 0;
          }
          .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
            color: #856404;
          }
          .instructions li {
            margin: 8px 0;
          }
          .security-notice {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .security-notice h2 {
            color: #721c24;
            font-size: 16px;
            margin: 0 0 10px 0;
          }
          .security-notice p {
            color: #721c24;
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-icon">📧</div>
            <h1>Email Address Change Verification</h1>
          </div>

          <div class="message">
            <p><strong>You requested to change your email address.</strong></p>
            <p>Your account email is being updated from your old address to this new address. To complete this change, please verify this email address using the code below.</p>

            <div class="email-box">
              <div class="label">Previous Email</div>
              <div class="value">${oldEmail}</div>
            </div>

            <div class="email-box">
              <div class="label">New Email (this address)</div>
              <div class="value">${newEmail}</div>
            </div>
          </div>

          <div class="code-section">
            <h2>Your Verification Code</h2>
            <div class="code">${code}</div>
            <p style="color: #6c757d; font-size: 14px; margin-top: 10px;">This code will expire in <strong>8 minutes</strong></p>
          </div>

          ${verificationUrl ? `
          <div class="url-section">
            <p>Verify at:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          </div>
          ` : ''}

          <div class="instructions">
            <h2>✅ To Complete Email Change</h2>
            <ol>
              <li>Enter the 6-digit verification code shown above</li>
              ${verificationUrl ? `<li>Visit the verification page or click the link above</li>` : `<li>Visit the verification page</li>`}
              <li>Your email will be updated immediately after verification</li>
              <li>You'll need to use this new email for future sign-ins</li>
            </ol>
          </div>

          <div class="security-notice">
            <h2>🚨 If You Didn't Request This Change</h2>
            <p><strong>Do not enter the verification code.</strong> Someone may have unauthorized access to your account.</p>
            <p>Take immediate action:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Sign in to your account at ${oldEmail}</li>
              <li>Review your security settings and passkeys</li>
              <li>Remove any unfamiliar devices</li>
              <li>This request will expire automatically in 8 minutes if not completed</li>
            </ul>
          </div>

          <div class="footer">
            <p><strong>This is an automated verification email.</strong></p>
            <p>If you have questions, please contact support.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
📧 EMAIL ADDRESS CHANGE VERIFICATION

You requested to change your email address.

Your account email is being updated from your old address to this new address. To complete this change, please verify this email address using the code below.

PREVIOUS EMAIL:
${oldEmail}

NEW EMAIL (this address):
${newEmail}

---

YOUR VERIFICATION CODE:
${code}

This code will expire in 8 minutes.

${verificationUrl ? `
VERIFY AT:
${verificationUrl}
` : ''}

---

✅ TO COMPLETE EMAIL CHANGE:
1. Enter the 6-digit verification code shown above
${verificationUrl ? `2. Visit the verification page or use the link above` : `2. Visit the verification page`}
3. Your email will be updated immediately after verification
4. You'll need to use this new email for future sign-ins

🚨 IF YOU DIDN'T REQUEST THIS CHANGE:
Do not enter the verification code. Someone may have unauthorized access to your account.

Take immediate action:
- Sign in to your account at ${oldEmail}
- Review your security settings and passkeys
- Remove any unfamiliar devices
- This request will expire automatically in 8 minutes if not completed

---

This is an automated verification email.
If you have questions, please contact support.
  `.trim();

  return {
    subject,
    html,
    text,
  };
}
