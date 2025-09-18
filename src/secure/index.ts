export type { CSRFOptions } from './csrf/@types/csrf.types';
export { csrfContext } from './csrf/csrf.middleware';
export { FormError, useFormField } from './csrf/form';
export type { SecureFetcherFormProps, SecureFetcherHandle, UseSecureFetcherOptions } from './csrf/SecureFetcher';
export { useSecureFetcher } from './csrf/SecureFetcher';
export { SecureProvider, useSecureToken } from './csrf/SecureProvider';
export type { RateLimiterConfig } from './rate-limiter/@types/rate-limiter.types';
export { defaultRateLimiterConfig } from './rate-limiter/rate-limiter.config';
export { getProviderConfig } from './rate-limiter/rate-limiter.provider';

import * as SecureFormComponents from './csrf/SecureForm';
import { SecureForm as SecureFormComponent } from './csrf/SecureForm';
export const SecureForm = Object.assign(SecureFormComponent, {
  Field: SecureFormComponents.SecureFormField,
  Error: SecureFormComponents.SecureFormError,
});

import * as FormComponents from './csrf/form';
import { Form as FormComponent } from './csrf/form';
export const Form = Object.assign(FormComponent, {
  Field: FormComponents.FormField,
  Error: FormComponents.FormError,
});

import * as SecureFetcherComponents from './csrf/SecureFetcher';
import { SecureFetcherForm as SecureFetcherFormComponent } from './csrf/SecureFetcher';
export const SecureFetcher = Object.assign(SecureFetcherFormComponent, {
  Field: SecureFetcherComponents.SecureFetcherField,
  Error: SecureFetcherComponents.SecureFetcherError,
});
