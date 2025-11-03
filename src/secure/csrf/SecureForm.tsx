import { Label } from '@ycore/componentry/vibrant';
import type { FieldErrors } from '@ycore/forge/result';
import clsx from 'clsx';
import React from 'react';
import { Form } from 'react-router';
import { AuthenticityTokenInput, useAuthenticityToken } from 'remix-utils/csrf/react';

// Types
export interface SecureFormProps extends React.ComponentProps<typeof Form> {
  /** Override the CSRF token field name (optional) */
  csrf_name?: string;
  /** Form-level and field-level errors */
  errors?: FieldErrors | null;
  children?: React.ReactNode;
}

export interface SecureFormFieldProps {
  name: string;
  label?: string;
  description?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface SecureFormErrorProps {
  error?: string | null;
  className?: string;
  id?: string;
}

const CSRF_TOKER_ERROR = 'Form load error. Please refresh the page or contact support if the issue persists.' as const;

// Context for passing errors down to field components
const SecureFormContext = React.createContext<{ errors: FieldErrors | null }>({ errors: null });

/** Form with CSRF protection and error handling */
export function SecureForm({ children, csrf_name, errors, ...props }: SecureFormProps): React.JSX.Element {
  const token = useAuthenticityToken();

  // Use override if provided, otherwise use default 'csrf_token'
  const tokenFieldName = csrf_name ?? 'csrf_token';
  const contextValue = React.useMemo(() => ({ errors: errors || null }), [errors]);

  return (
    // if CSRF token is missing, avoid unsecured form
    !token ? (
      <div role="alert" className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <SecureFormError error={CSRF_TOKER_ERROR} />
      </div>
    ) : (
      <SecureFormContext.Provider value={contextValue}>
        <Form role="form" {...props}>
          <AuthenticityTokenInput name={tokenFieldName} />

          {/* CSRF validation errors, if present */}
          {errors?.csrf && <SecureFormError error={errors.csrf} className="mb-4" />}

          {/* General form errors, if present */}
          {errors?.form && !errors.csrf && <SecureFormError error={errors.form} className="mb-4" />}

          {children}
        </Form>
      </SecureFormContext.Provider>
    )
  );
}

/** Form field with automatic error display and ARIA attributes */
export function SecureFormField({ name, label, description, error, required, className, children }: SecureFormFieldProps): React.JSX.Element {
  const { errors } = React.useContext(SecureFormContext);
  const fieldError = error || errors?.[name];
  const errorId = fieldError ? `${name}-error` : undefined;

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <Label htmlFor={name}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            id: (child.props as any).id || name,
            name: (child.props as any).name || name,
            'aria-invalid': fieldError ? true : undefined,
            'aria-describedby': fieldError ? errorId : (child.props as any)['aria-describedby'],
          });
        }
        return child;
      })}
      {fieldError && (
        <p id={errorId} className="text-destructive text-sm" role="alert">
          {fieldError}
        </p>
      )}
    </div>
  );
}

/** Displays form-level error messages */
export function SecureFormError({ error, className, id }: SecureFormErrorProps): React.JSX.Element | null {
  if (!error) {
    return null;
  }

  return (
    <p id={id} data-slot="form-error" className={clsx('text-destructive text-sm', className)} role="alert">
      {error}
    </p>
  );
}

/** Returns form field props with error handling */
export function useSecureFormField(name: string): { error?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string } {
  const { errors } = React.useContext(SecureFormContext);
  const error = errors?.[name];

  if (!error) {
    return {};
  }

  return {
    error,
    'aria-invalid': true,
    'aria-describedby': `${name}-error`,
  };
}
