import { Form } from 'react-router';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';

import type { SecureFormProps } from './@types/SecureForm.types';

export const SecureForm = ({ children, csrf_name = 'csrf_token', ...props }: SecureFormProps) => {
  return (
    <Form {...props}>
      <AuthenticityTokenInput name={csrf_name} />
      {children}
    </Form>
  );
};
