import { Form } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';

import type { SecureFormProps } from './@types/SecureForm.types';

export const SecureForm = ({ children, csrf_name, ...props }: SecureFormProps) => {
  console.log({ csrf_name })
  return (
    <Form {...props}>
      <AuthenticityTokenInput name={csrf_name} />
      {children}
    </Form>
  );
};
