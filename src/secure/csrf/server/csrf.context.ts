import { createContext } from 'react-router';
import type { CSRFData } from '../@types/csrf.types';

/**
 * CSRF token context for server-side form protection
 * This is a React Router context used to pass CSRF data from middleware to loaders
 */
export const csrfContext = createContext<CSRFData | null>(null);

/**
 * Context to skip CSRF validation for specific requests
 * Used for authenticated API routes or custom validation flows
 */
export const skipCSRFValidation = createContext<boolean>(false);
