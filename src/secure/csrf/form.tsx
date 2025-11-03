import { Label } from '@ycore/componentry/vibrant';
import clsx from 'clsx';
import React from 'react';
import type { FormErrorProps, FormFieldContextValue, FormFieldProps } from './@types/form.types';

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export { Form } from 'react-router';

export function FormField({ label, description, error, className, children }: FormFieldProps): React.JSX.Element {
  const id = React.useId();
  const fieldId = `${id}-field`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  const contextValue = React.useMemo(() => ({ fieldId, descriptionId, errorId, hasError }), [fieldId, descriptionId, errorId, hasError]);

  const enhancedChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;

    const childProps = child.props as any;
    if (childProps.name) {
      const ariaDescribedBy = [description && descriptionId, error && errorId].filter(Boolean).join(' ') || undefined;

      return React.cloneElement(child as React.ReactElement<any>, {
        id: childProps.id || fieldId,
        'aria-invalid': hasError || undefined,
        'aria-describedby': ariaDescribedBy,
        'data-error': hasError || undefined,
      });
    }

    return child;
  });

  return (
    <FormFieldContext.Provider value={contextValue}>
      <div className={clsx('space-y-2', className)} data-slot="form-field">
        {label && (
          <Label htmlFor={fieldId} data-slot="form-label" data-error={hasError} className={clsx(hasError && 'text-destructive')}>
            {label}
          </Label>
        )}

        {enhancedChildren}

        {description && !error && (
          <p id={descriptionId} data-slot="form-description" className="text-muted-foreground text-sm">
            {description}
          </p>
        )}

        {error && <FormError id={errorId} error={error} />}
      </div>
    </FormFieldContext.Provider>
  );
}

export function FormError({ error, className, id }: FormErrorProps): React.JSX.Element | null {
  if (!error) {
    return null;
  }

  return (
    <p id={id} data-slot="form-error" className={clsx('text-destructive text-sm', className)}>
      {error}
    </p>
  );
}

export function useFormField() {
  const context = React.useContext(FormFieldContext);

  if (!context) {
    throw new Error('useFormField must be used within a FormField');
  }

  return context;
}
