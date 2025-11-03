/**
 * Email Template Renderer
 *
 * This file provides the rendering interface for email templates
 * using the new custom email components system.
 */

import { type EmailRenderOptions, type EmailTemplatePropsWithSubject as NewEmailTemplatePropsWithSubject, renderEmail } from '@ycore/componentry/email/server';
import type { EmailTemplate } from '../@types/email.types';
import type { EmailTemplateObject } from '../@types/email-template-builder';

/**
 * Generic email template renderer - handles rendering React email templates to HTML and plaintext
 *
 * Accepts EmailTemplateObject created by defineEmailTemplate() and renders it with the provided data.
 * Automatically extracts subject from the template definition and applies Tailwind styles map.
 *
 * @example
 * ```typescript
 * const email = await renderEmailTemplate(ContactEmailTemplate, {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   message: 'Hello!',
 *   origin: 'https://example.com',
 * });
 * ```
 */
export async function renderEmailTemplate<TData>(template: EmailTemplateObject<TData>, data: TData, options?: EmailRenderOptions): Promise<EmailTemplate> {
  // Use the new renderEmail function from custom components
  const result = await renderEmail(
    template.component,
    {
      ...data,
      subject: template.subject,
    } as NewEmailTemplatePropsWithSubject<TData>,
    {
      ...options,
      tailwindStylesMap: template.stylesMap ?? options?.tailwindStylesMap,
    }
  );

  return {
    subject: result.subject || '',
    html: result.html,
    text: result.text,
  };
}
