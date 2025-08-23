import type { EmailTemplate, TotpEmailData } from "../@types/email.types";

/**
 * Authentication TOTP Email Template
 * Email template for TOTP verification codes
 */
export function createTotpTemplate(data: TotpEmailData): EmailTemplate {
  const { code } = data;

  const subject = "Your verification code";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verification Code</title>
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
            padding: 40px 20px;
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
            margin: 20px 0;
            color: #495057;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verification Code</h1>
            <p>Use this code to complete your authentication:</p>
          </div>

          <div class="code">${code}</div>

          <div class="footer">
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Your verification code: ${code}

Use this code to complete your authentication.
This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.
  `.trim();

  return {
    subject,
    html,
    text,
  };
}
