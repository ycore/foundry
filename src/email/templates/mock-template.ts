import type { EmailTemplate } from '../@types/email.types';

export interface MockEmailData {
  subject: string;
  message: string;
  recipientName?: string;
}

/**
 * Mock Email Template
 * Generic template for demonstration and testing purposes
 */
export function createMockTemplate(data: MockEmailData): EmailTemplate {
  const { subject, message, recipientName = 'there' } = data;

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
    text,
  };
}
