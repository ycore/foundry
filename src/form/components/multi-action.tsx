import React from 'react';

export interface MultiActionInputProps {
  name?: string;
  value?: string;
}

export function MultiActionInput({ name = 'intent', value = 'default' }: MultiActionInputProps) {
  return <input type="hidden" value={value} name={name} />;
}
