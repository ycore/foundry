import type { AppError } from '@ycore/forge/result';

export interface SecureProviderData {
  csrfToken: string | null | undefined;
  errors?: AppError;
}

export interface SecureProviderProps {
  loaderData: SecureProviderData;
}
