import type { ReactNode } from 'react';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import type { CSRFData } from './@types/csrf.types';
import { SecureContextProvider } from './csrf.context';

export interface SecureProviderProps {
  children: ReactNode;
  csrfData: CSRFData | null;
}

/** Provides CSRF protection with unified context */
export const SecureProvider = ({ children, csrfData }: SecureProviderProps) => {
  const token = csrfData?.token ?? '';

  return (
    <SecureContextProvider value={csrfData}>
      <AuthenticityTokenProvider token={token}>{children}</AuthenticityTokenProvider>
    </SecureContextProvider>
  );
};
