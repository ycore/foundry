import { createContextSingleton } from '@ycore/forge/context';
import type { EmailConfig } from './@types/email.types';

/**
 * Email configuration context for React Router - singleton pattern to prevent context duplication
 */
export const emailContext = createContextSingleton<EmailConfig | null>('EmailContext', null);
