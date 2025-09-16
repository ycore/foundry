import React from 'react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import type { SecureFormErrorProps, SecureFormFieldContextValue, SecureFormFieldProps, SecureFormProps } from './@types/SecureForm.types';
import { Form, FormError, FormField } from './form';

const SecureFormFieldContext = React.createContext<SecureFormFieldContextValue | null>(null);

function SecureFormComponent({ children, csrf_name = 'csrf_token', errors, ...props }: SecureFormProps) {
  const contextValue = React.useMemo(() => ({ errors: errors || null }), [errors]);

  return (
    <SecureFormFieldContext.Provider value={contextValue}>
      <Form {...props}>
        <AuthenticityTokenInput name={csrf_name} />
        {errors?.csrf && <FormError error={errors.csrf} />}
        {children}
      </Form>
    </SecureFormFieldContext.Provider>
  );
}

function SecureFormField({ label, description, name, className, children }: SecureFormFieldProps) {
  const context = React.useContext(SecureFormFieldContext);

  const error = name && context?.errors ? (typeof context.errors === 'object' && context.errors[name]) || (context.errors as any)?.fields?.[name] || null : null;

  return (
    <FormField label={label} description={description} error={error} className={className}>
      {children}
    </FormField>
  );
}

function SecureFormError({ error, className, id }: SecureFormErrorProps) {
  return <FormError error={error} className={className} id={id} />;
}

export { SecureFormComponent as SecureForm, SecureFormField, SecureFormError };
