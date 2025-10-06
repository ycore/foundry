import { createContext, useContext } from 'react';
import type { CSRFData } from './@types/csrf.types';
import { defaultCSRFConfig } from './csrf.config';

/**
 * Secure context provides CSRF token and configuration to client components
 */
const SecureContext = createContext<CSRFData | null>(null);

export const SecureContextProvider = SecureContext.Provider;

/**
 * Access CSRF token and configuration
 * Returns token and field names needed for form submissions
 */
export function useSecureContext(): CSRFData {
  const data = useContext(SecureContext);

  // Fallback to defaults if provider not found
  if (!data) {
    return {
      token: '',
      formDataKey: defaultCSRFConfig.formDataKey,
      headerName: defaultCSRFConfig.headerName,
    };
  }

  return data;
}