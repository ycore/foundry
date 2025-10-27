import { render } from '@react-email/components';
import type { JSXElementConstructor, ReactElement } from 'react';
import type { EmailTemplate } from '../@types/email.types';

/**
 * Props wrapper that includes subject metadata
 * The subject is not passed to the component, but used for email metadata
 */
export type EmailTemplatePropsWithSubject<TComponentProps> = TComponentProps & {
  subject: string | ((props: TComponentProps) => string);
};

/**
 * Generic email template renderer - handles rendering React email components to HTML and plaintext
 */
export async function renderEmailTemplate<TComponentProps>(
  component: (props: TComponentProps) => ReactElement<unknown, string | JSXElementConstructor<unknown>>,
  props: EmailTemplatePropsWithSubject<TComponentProps>
): Promise<EmailTemplate> {
  const { subject } = props;

  // Determine email subject and component props based on subject type
  let emailSubject: string;
  let componentProps: TComponentProps;

  if (typeof subject === 'function') {
    // Subject is a function - extract it and derive email subject from component props
    const { subject: _, ...restProps } = props;
    componentProps = restProps as TComponentProps;
    emailSubject = subject(componentProps);
  } else {
    // Subject is a string - keep it in component props AND use for email metadata
    componentProps = props as TComponentProps;
    emailSubject = subject;
  }

  // Render component with appropriate props
  const [html, text] = await Promise.all([render(component(componentProps)), render(component(componentProps), { plainText: true })]);

  return {
    subject: emailSubject,
    html,
    text,
  };
}
