import type { ErrorCollection } from '@ycore/forge/error';

export interface SecureProviderData {
  csrfToken: string | null | undefined;
  errors?: ErrorCollection;
}

export interface SecureProviderProps {
  loaderData: SecureProviderData;
}
