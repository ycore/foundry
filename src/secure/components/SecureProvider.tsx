import { Outlet } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';

import type { SecureProviderProps } from './@types/SecureProvider.types';

export const SecureProvider = ({ loaderData }: SecureProviderProps) => {
  const { csrfToken } = loaderData;
  return (
    <AuthenticityTokenProvider token={csrfToken}>
      <Outlet />
    </AuthenticityTokenProvider>
  );
};
