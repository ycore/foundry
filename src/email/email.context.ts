import { unstable_createContext, type unstable_RouterContextProvider } from 'react-router';
import type { EmailConfig } from './@types/email.types';

// Context key for email configuration
export const emailContext = unstable_createContext<EmailConfig | null>(null);

/**
 * Set email configuration in React Router context
 */
export function setEmailConfig(context: unstable_RouterContextProvider, emailConfig: EmailConfig): void {
  context.set(emailContext, emailConfig);
}

/**
 * Get email configuration from React Router context
 */
export function getEmailConfig(context: Readonly<unstable_RouterContextProvider>): EmailConfig | null {
  return context.get(emailContext) || null;
}
