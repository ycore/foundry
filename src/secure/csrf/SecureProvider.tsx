import { isError } from '@ycore/forge/result';
import type { ReactNode } from 'react';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import type { SecureProviderProps } from './@types/SecureProvider.types';

export { useAuthenticityToken as useSecureToken } from 'remix-utils/csrf/react';

export const SecureProvider = ({ loaderData, children }: SecureProviderProps & { children: ReactNode }) => {
  let csrfToken: string | null | undefined = null;

  if (loaderData) {
    if (isError(loaderData)) {
      // If loader returned an error, no CSRF token available
      csrfToken = null;
    } else if (typeof loaderData === 'object' && 'csrfToken' in loaderData) {
      // Direct object with csrfToken property
      csrfToken = (loaderData).csrfToken;
    }
  }

  return <AuthenticityTokenProvider token={csrfToken ?? ''}>{children}</AuthenticityTokenProvider>;
};
