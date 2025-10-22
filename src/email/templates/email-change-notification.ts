import type { EmailTemplate } from '../@types/email.types';

export interface EmailChangeNotificationData {
  oldEmail: string;
  newEmail: string;
}

/**
 * Email Change Notification Template
 * Sent to the old email address to inform about email change request
 * This is an informational notification, not a verification email
 */
export function createEmailChangeNotificationTemplate(data: EmailChangeNotificationData): EmailTemplate {
  const { oldEmail, newEmail } = data;

  const subject = 'Email Change Request - Action May Be Required';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Email Change Request</title>
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
            border-left: 4px solid #ffc107;
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
          .action-section {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .action-section h2 {
            color: #721c24;
            font-size: 16px;
            margin: 0 0 10px 0;
          }
          .action-section ul {
            margin: 10px 0;
            padding-left: 20px;
            color: #721c24;
          }
          .action-section li {
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
            <div class="warning-icon">⚠️</div>
            <h1>Email Change Request</h1>
          </div>

          <div class="message">
            <p><strong>This is an important security notification.</strong></p>
            <p>A request has been made to change the email address associated with your account.</p>

            <div class="email-box">
              <div class="label">Current Email (this address)</div>
              <div class="value">${oldEmail}</div>
            </div>

            <div class="email-box">
              <div class="label">Requested New Email</div>
              <div class="value">${newEmail}</div>
            </div>

            <p>A verification code has been sent to the new email address. Your account email will only be changed after the new address is successfully verified.</p>
          </div>

          <div class="action-section">
            <h2>🔒 If You Made This Request</h2>
            <ul>
              <li>No action is needed from your side</li>
              <li>Check your new email inbox for the verification code</li>
              <li>This request will expire in <strong>8 minutes</strong> if not completed</li>
            </ul>
          </div>

          <div class="action-section">
            <h2>🚨 If You Did NOT Make This Request</h2>
            <ul>
              <li><strong>Take immediate action</strong> - someone may have unauthorized access to your account</li>
              <li>Sign in to your account and review your security settings</li>
              <li>Check your passkeys and remove any unfamiliar devices</li>
              <li>Add a new passkey if you suspect compromise</li>
              <li>This verification request will expire automatically in 8 minutes if not completed</li>
            </ul>
          </div>

          <div class="footer">
            <p><strong>This is an automated security notification.</strong></p>
            <p>If you have concerns about your account security, please review your account settings immediately.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
⚠️ EMAIL CHANGE REQUEST - ACTION MAY BE REQUIRED

This is an important security notification.

A request has been made to change the email address associated with your account.

CURRENT EMAIL (this address):
${oldEmail}

REQUESTED NEW EMAIL:
${newEmail}

A verification code has been sent to the new email address. Your account email will only be changed after the new address is successfully verified.

---

🔒 IF YOU MADE THIS REQUEST:
- No action is needed from your side
- Check your new email inbox for the verification code
- This request will expire in 8 minutes if not completed

🚨 IF YOU DID NOT MAKE THIS REQUEST:
- Take immediate action - someone may have unauthorized access to your account
- Sign in to your account and review your security settings
- Check your passkeys and remove any unfamiliar devices
- Add a new passkey if you suspect compromise
- This verification request will expire automatically in 8 minutes if not completed

---

This is an automated security notification.
If you have concerns about your account security, please review your account settings immediately.
  `.trim();

  return {
    subject,
    html,
    text,
  };
}
