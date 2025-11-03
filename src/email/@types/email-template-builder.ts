import type { TailwindStylesMap } from '@ycore/componentry/email/server';
import type { JSXElementConstructor, ReactElement } from 'react';

/**
 * Email Template Definition
 *
 * Type-safe structure for defining email templates with component, subject, and styles map
 */
export interface EmailTemplateDefinition<TData> {
  component: (props: TData) => ReactElement<unknown, string | JSXElementConstructor<unknown>>;
  subject: (data: TData) => string;
  stylesMap?: TailwindStylesMap;
}

/**
 * Email Template Object
 *
 * Returned by defineEmailTemplate with helper methods
 */
export interface EmailTemplateObject<TData> {
  component: (props: TData) => ReactElement<unknown, string | JSXElementConstructor<unknown>>;
  subject: (data: TData) => string;
  stylesMap?: TailwindStylesMap;
  render: (data: TData) => {
    component: ReactElement<unknown, string | JSXElementConstructor<unknown>>;
    subject: string;
    stylesMap?: TailwindStylesMap;
  };
}

/**
 * Define Email Template
 *
 * Type-safe helper for creating unified email templates
 *
 * @example
 * ```typescript
 * export const ContactTemplate = defineEmailTemplate({
 *   component: ({ name, email }) => <Html>...</Html>,
 *   subject: ({ name }) => `Contact from ${name}`,
 *   stylesMap: TEMPLATE_TAILWIND_MAP,
 * });
 * ```
 */
export function defineEmailTemplate<TData>({ component, subject, stylesMap }: EmailTemplateDefinition<TData>): EmailTemplateObject<TData> {
  return {
    component,
    subject,
    stylesMap,
    // Helper method for type-safe rendering
    render: (data: TData) => ({
      component: component(data),
      subject: subject(data),
      stylesMap,
    }),
  };
}
