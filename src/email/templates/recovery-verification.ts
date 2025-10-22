import type { EmailTemplate } from '../@types/email.types';

export interface RecoveryVerificationData {
  code: string;
  email: string;
  verificationUrl?: string;
}

/**
 * Account Recovery Verification Template
 * Sent when user requests account recovery (lost passkey access)
 * Combines security notification + verification code in a single email
 */
export function createRecoveryVerificationTemplate(data: RecoveryVerificationData): EmailTemplate {
  const { code, email, verificationUrl } = data;

  const subject = 'Account Recovery - Verification Required';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Account Recovery Verification</title>
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #333;
            background: #fff3cd;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #ffc107;
          }
          .header {
            text-align: center;
            padding: 20px 20px 10px;
          }
          .header h1 {
            color: #856404;
            margin: 0;
            font-size: 24px;
          }
          .warning-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .message {
            background: white;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #dc3545;
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
            background: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
            border: 2px solid #dc3545;
          }
          .code-section h2 {
            color: #721c24;
            font-size: 18px;
            margin: 0 0 15px 0;
          }
          .code {
            background: #f8f9fa;
            border: 2px solid #dc3545;
            border-radius: 8px;
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 10px;
            padding: 20px;
            margin: 15px 0;
            color: #dc3545;
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
          .action-section {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .action-section h2 {
            color: #0c5460;
            font-size: 16px;
            margin: 0 0 10px 0;
          }
          .action-section ul {
            margin: 10px 0;
            padding-left: 20px;
            color: #0c5460;
          }
          .action-section li {
            margin: 5px 0;
          }
          .danger-section {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .danger-section h2 {
            color: #721c24;
            font-size: 16px;
            margin: 0 0 10px 0;
          }
          .danger-section ul {
            margin: 10px 0;
            padding-left: 20px;
            color: #721c24;
          }
          .danger-section li {
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #856404;
            font-size: 14px;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="warning-icon">🔐</div>
            <h1>Account Recovery Request</h1>
          </div>

          <div class="message">
            <p><strong>This is an important security notification.</strong></p>
            <p>A request has been made to recover access to your account. This process will allow registration of a new passkey after email verification.</p>

            <div class="email-box">
              <div class="label">Account Email</div>
              <div class="value">${email}</div>
            </div>

            <p>If you requested this recovery, use the verification code below to proceed. After verification, you'll be able to register a new passkey. Your old passkeys will be removed after you successfully sign in with the new passkey.</p>
          </div>

          <div class="code-section">
            <h2>Your Verification Code</h2>
            <div class="code">${code}</div>
            <p style="color: #721c24; font-size: 14px; margin-top: 10px;">This code will expire in <strong>8 minutes</strong></p>
          </div>

          ${verificationUrl ? `
          <div class="url-section">
            <p>Verify at:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          </div>
          ` : ''}

          <div class="action-section">
            <h2>✅ If You Requested This Recovery</h2>
            <ul>
              <li>Enter the 6-digit code shown above on the verification page</li>
              ${verificationUrl ? `<li>Or click the verification link above to proceed</li>` : ``}
              <li>After verification, you'll be redirected to register a new passkey</li>
              <li>Sign in with your new passkey to complete the recovery</li>
              <li>Your old passkeys will be automatically removed on successful sign-in</li>
            </ul>
          </div>

          <div class="danger-section">
            <h2>🚨 If You Did NOT Request This Recovery</h2>
            <ul>
              <li><strong>Take immediate action</strong> - someone may be attempting to access your account</li>
              <li>Change your email password immediately</li>
              <li>Enable two-factor authentication on your email account</li>
              <li><strong>Do NOT enter the verification code</strong></li>
              <li>The recovery request will expire automatically in 8 minutes if not completed</li>
              <li>Your existing passkeys remain secure and functional</li>
            </ul>
          </div>

          <div class="footer">
            <p><strong>This is an automated security notification.</strong></p>
            <p>If you have concerns about your account security, please contact support immediately.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
🔐 ACCOUNT RECOVERY REQUEST - VERIFICATION REQUIRED

This is an important security notification.

A request has been made to recover access to your account. This process will allow registration of a new passkey after email verification.

ACCOUNT EMAIL:
${email}

If you requested this recovery, use the verification code below to proceed. After verification, you'll be able to register a new passkey. Your old passkeys will be removed after you successfully sign in with the new passkey.

---

YOUR VERIFICATION CODE:
${code}

This code will expire in 8 minutes.

${verificationUrl ? `
VERIFY AT:
${verificationUrl}
` : ''}

---

✅ IF YOU REQUESTED THIS RECOVERY:
- Enter the 6-digit code shown above on the verification page
${verificationUrl ? `- Or use the verification link above to proceed` : ``}
- After verification, you'll be redirected to register a new passkey
- Sign in with your new passkey to complete the recovery
- Your old passkeys will be automatically removed on successful sign-in

🚨 IF YOU DID NOT REQUEST THIS RECOVERY:
- Take immediate action - someone may be attempting to access your account
- Change your email password immediately
- Enable two-factor authentication on your email account
- Do NOT enter the verification code
- The recovery request will expire automatically in 8 minutes if not completed
- Your existing passkeys remain secure and functional

---

This is an automated security notification.
If you have concerns about your account security, please contact support immediately.
  `.trim();

  return {
    subject,
    html,
    text,
  };
}
