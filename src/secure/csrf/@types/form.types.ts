import type React from 'react';

export interface FormErrorProps {
  error?: React.ReactNode;
  className?: string;
  id?: string;
}

export interface FormFieldProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  name?: string; // Optional field name for extracting errors from AppError.details
}

export interface FormFieldContextValue {
  fieldId: string;
  descriptionId: string;
  errorId: string;
  hasError: boolean;
}
