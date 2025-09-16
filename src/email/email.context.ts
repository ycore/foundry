import { createContext, type RouterContextProvider } from 'react-router';
import type { EmailConfig } from './@types/email.types';

// Context key for email configuration
export const emailContext = createContext<EmailConfig | null>(null);

/**
 * Set email configuration in React Router context
 */
export function setEmailConfig(context: RouterContextProvider, emailConfig: EmailConfig): void {
  context.set(emailContext, emailConfig);
}

/**
 * Get email configuration from React Router context
 */
export function getEmailConfig(context: Readonly<RouterContextProvider>): EmailConfig | null {
  return context.get(emailContext) || null;
}
