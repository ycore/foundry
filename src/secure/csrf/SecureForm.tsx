import { Label } from '@ycore/componentry/shadcn-ui';
import type { FieldErrors } from '@ycore/forge/result';
import { extractFieldErrors, isError } from '@ycore/forge/result';
import clsx from 'clsx';
import React from 'react';
import { Form } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';

// Types
export interface SecureFormProps extends React.ComponentProps<typeof Form> {
  csrf_name?: string;
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

// Context for passing errors down
const SecureFormContext = React.createContext<{
  errors: FieldErrors | null;
}>({
  errors: null,
});

/**
 * SecureForm component with CSRF protection and error handling
 */
export function SecureForm({ children, csrf_name = 'csrf_token', errors, ...props }: SecureFormProps) {
  const contextValue = React.useMemo(
    () => ({
      errors: errors || null,
    }),
    [errors]
  );

  return (
    <SecureFormContext.Provider value={contextValue}>
      <Form {...props}>
        <AuthenticityTokenInput name={csrf_name} />
        {errors?.csrf && <SecureFormError error={errors.csrf} className="mb-4" />}
        {errors?.form && !errors.csrf && <SecureFormError error={errors.form} className="mb-4" />}
        {children}
      </Form>
    </SecureFormContext.Provider>
  );
}

/**
 * SecureFormField component for consistent field rendering with errors
 */
export function SecureFormField({ name, label, description, error: explicitError, required, className, children }: SecureFormFieldProps) {
  const context = React.useContext(SecureFormContext);
  const id = React.useId();

  // Get error from context or use explicit error
  const error = explicitError ?? context.errors?.[name] ?? null;
  const hasError = Boolean(error);

  const fieldId = `${id}-field`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  // Enhance children with ARIA attributes
  const enhancedChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;

    const childProps = child.props as any;

    // Only enhance form inputs with the matching name
    if (childProps.name === name) {
      const ariaDescribedBy = [description && descriptionId, error && errorId].filter(Boolean).join(' ') || undefined;

      return React.cloneElement(child as React.ReactElement<any>, {
        id: childProps.id || fieldId,
        'aria-invalid': hasError || undefined,
        'aria-describedby': ariaDescribedBy,
        'aria-required': required || undefined,
        'data-error': hasError || undefined,
      });
    }

    return child;
  });

  return (
    <div className={clsx('space-y-2', className)} data-slot="form-field">
      {label && (
        <Label htmlFor={fieldId} data-slot="form-label" data-error={hasError} className={clsx(hasError && 'text-destructive')}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}

      {enhancedChildren}

      {description && !error && (
        <p id={descriptionId} data-slot="form-description" className="text-muted-foreground text-sm">
          {description}
        </p>
      )}

      {error && <SecureFormError id={errorId} error={error} />}
    </div>
  );
}

/**
 * SecureFormError component for displaying errors
 */
export function SecureFormError({ error, className, id }: SecureFormErrorProps) {
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
 * Hook to access form context
 */
export function useSecureForm() {
  const context = React.useContext(SecureFormContext);

  if (!context) {
    throw new Error('useSecureForm must be used within a SecureForm');
  }

  return context;
}

/**
 * Helper component to extract errors from action data
 */
export function SecureFormWithData<T = any>({ actionData, children, ...props }: SecureFormProps & { actionData?: T }) {
  const errors = actionData && isError(actionData) ? extractFieldErrors(actionData) : null;

  return (
    <SecureForm errors={errors} {...props}>
      {children}
    </SecureForm>
  );
}

/**
 * Utility to create field props from errors
 */
export function createFieldProps(
  name: string,
  errors?: FieldErrors | null
): {
  error?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
} {
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
