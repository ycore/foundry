import type React from 'react';
import type { FormProps } from 'react-router';

export interface SecureFormProps extends FormProps {
  csrf_name?: string;
  errors?: Record<string, React.ReactNode> | null;
  children: React.ReactNode;
}

export interface SecureFormFieldProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  name?: string;
  className?: string;
  children: React.ReactNode;
}

export interface SecureFormErrorProps {
  error?: React.ReactNode;
  className?: string;
  id?: string;
}

export interface SecureFormFieldContextValue {
  errors: Record<string, React.ReactNode> | null;
}
