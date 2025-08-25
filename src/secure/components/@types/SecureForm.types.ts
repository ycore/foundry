import type React from 'react';
import type { FormProps } from 'react-router';

export interface SecureFormProps extends FormProps {
  csrf_name?: string;
  children: React.ReactNode;
}
