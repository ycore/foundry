import type { FieldErrors } from '@ycore/forge/result';
import { extractFieldErrors, isError } from '@ycore/forge/result';
import clsx from 'clsx';
import React from 'react';
import { type FetcherWithComponents, type SubmitOptions, useFetcher } from 'react-router';
import { AuthenticityTokenInput, useAuthenticityToken } from 'remix-utils/csrf/react';

// Types
export interface SecureFetcherFormProps extends Omit<React.ComponentProps<'form'>, 'method' | 'action' | 'encType'> {
  csrf_name?: string;
  errors?: FieldErrors | null;
  fetcher: FetcherWithComponents<unknown>;
  children?: React.ReactNode;
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  action?: string;
  encType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
}

export interface UseSecureFetcherOptions {
  key?: string;
}

export interface SecureFetcherHandle<T = unknown> {
  SecureForm: React.FC<Omit<SecureFetcherFormProps, 'fetcher'>>;
  submitSecure: (data: FormData, options?: SubmitOptions) => void;
  errors: FieldErrors | null;
  data: T | undefined;
  state: 'idle' | 'submitting' | 'loading';
  Form: FetcherWithComponents<T>['Form'];
  submit: FetcherWithComponents<T>['submit'];
  load: FetcherWithComponents<T>['load'];
  formData: FormData | undefined;
  formMethod: 'get' | 'post' | 'put' | 'patch' | 'delete' | undefined;
  formAction: string | undefined;
  formEncType: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'application/json' | 'text/plain' | undefined;
}

/**
 * Hook that provides a fetcher with built-in CSRF protection
 */
export function useSecureFetcher<T = unknown>({ key }: UseSecureFetcherOptions = {}): SecureFetcherHandle<T> {
  const fetcher = useFetcher<T>({ key });
  const csrfToken = useAuthenticityToken();

  // Extract errors from fetcher data if present
  const errors = React.useMemo(() => {
    if (fetcher.data && isError(fetcher.data)) {
      return extractFieldErrors(fetcher.data);
    }
    return null;
  }, [fetcher.data]);

  // Secure submit function that automatically adds CSRF token
  const submitSecure = React.useCallback(
    (data: FormData, options?: SubmitOptions) => {
      const secureData = new FormData();

      // Copy all existing form data
      for (const [key, value] of data.entries()) {
        secureData.append(key, value);
      }

      // Add CSRF token if not present
      if (!secureData.has('csrf_token') && csrfToken) {
        secureData.append('csrf_token', csrfToken);
      }

      fetcher.submit(secureData, options);
    },
    [fetcher, csrfToken]
  );

  // SecureForm component bound to this fetcher
  const SecureForm = React.useMemo(
    () =>
      React.forwardRef<HTMLFormElement, Omit<SecureFetcherFormProps, 'fetcher'>>(({ children, csrf_name = 'csrf_token', errors: explicitErrors, ...props }, ref) => (
        <SecureFetcherForm ref={ref} fetcher={fetcher} csrf_name={csrf_name} errors={explicitErrors || errors} {...props}>
          {children}
        </SecureFetcherForm>
      )),
    [fetcher, errors]
  );

  SecureForm.displayName = 'SecureForm';

  return {
    SecureForm,
    submitSecure,
    errors,
    data: fetcher.data as T | undefined,
    state: fetcher.state,
    Form: fetcher.Form,
    submit: fetcher.submit,
    load: fetcher.load,
    formData: fetcher.formData,
    formMethod: fetcher.formMethod?.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete' | undefined,
    formAction: fetcher.formAction,
    formEncType: fetcher.formEncType,
  };
}

/**
 * SecureFetcherForm component with CSRF protection
 */
export const SecureFetcherForm = React.forwardRef<HTMLFormElement, SecureFetcherFormProps>(({ children, csrf_name = 'csrf_token', errors, fetcher, className, ...props }, ref) => {
  const FetcherForm = fetcher.Form;

  return (
    <FetcherForm ref={ref} className={className} {...props}>
      <AuthenticityTokenInput name={csrf_name} />
      {errors?.csrf && <SecureFetcherError error={errors.csrf} className="mb-4" />}
      {errors?.form && !errors.csrf && <SecureFetcherError error={errors.form} className="mb-4" />}
      {children}
    </FetcherForm>
  );
});

SecureFetcherForm.displayName = 'SecureFetcherForm';

/**
 * Error component for SecureFetcher
 */
export function SecureFetcherError({ error, className, id }: { error?: string | null; className?: string; id?: string }) {
  if (!error) {
    return null;
  }

  return (
    <p id={id} data-slot="form-error" className={clsx('text-destructive text-sm', className)} role="alert">
      {error}
    </p>
  );
}

/**
 * Field component for SecureFetcher forms (reuses SecureFormField logic)
 */
export { SecureFormField as SecureFetcherField } from './SecureForm';

/**
 * Helper to create fetcher field props
 */
export function createFetcherFieldProps(name: string, errors?: FieldErrors | null): { error?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string; } {
  const error = errors?.[name];

  if (!error) {
    return {};
  }

  return { error, 'aria-invalid': true, 'aria-describedby': `${name}-error` };
}
