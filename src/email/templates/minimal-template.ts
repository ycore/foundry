import type { EmailTemplate } from '../@types/email.types';

export interface SimpleEmailData {
  subject: string;
  message: string;
}

/**
 * Minimal Email Template
 */
export function createMinimalTemplate(data: SimpleEmailData): EmailTemplate {
  const { subject, message } = data;
  const html = `<p>${message}</p>`;
  const text = `${message}`.trim();

  return { subject, html, text };
}
