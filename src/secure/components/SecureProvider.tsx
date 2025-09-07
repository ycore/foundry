import type { ReactNode } from 'react';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';

import type { SecureProviderProps } from './@types/SecureProvider.types';

export const SecureProvider = ({ loaderData, children }: SecureProviderProps & { children: ReactNode }) => {
  const { csrfToken } = loaderData;

  return (
    <AuthenticityTokenProvider token={csrfToken ?? ''}>
      {children}
    </AuthenticityTokenProvider>
  );
};
