import { createContextSingleton } from '@ycore/forge/context';
import type { CSRFData } from '../@types/csrf.types';

/**
 * CSRF token context for server-side form protection - singleton pattern to prevent context duplication
 */
export const csrfContext = createContextSingleton<CSRFData | null>('CSRFContext', null);

/**
 * Context to skip CSRF validation for specific requests - singleton pattern to prevent context duplication
 */
export const skipCSRFValidation = createContextSingleton<boolean>('SkipCSRFValidation', false);
