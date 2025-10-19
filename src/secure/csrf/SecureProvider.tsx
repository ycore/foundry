import type { ReactNode } from 'react';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';

export interface SecureProviderProps {
  children: ReactNode;
  token: string;
}

/** Provides CSRF protection using remix-utils token context */
export const SecureProvider = ({ children, token }: SecureProviderProps) => {
  return <AuthenticityTokenProvider token={token}>{children}</AuthenticityTokenProvider>;
};
