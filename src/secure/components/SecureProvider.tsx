import { Outlet, useLoaderData } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';

import type { SecureProviderData } from './@types/SecureProvider.types';

export const SecureProvider = () => {
  const { csrfToken } = useLoaderData<SecureProviderData>();

  return (
    <AuthenticityTokenProvider token={csrfToken}>
      <Outlet />
    </AuthenticityTokenProvider>
  );
};
