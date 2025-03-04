import { MultiActionInput, type MultiActionInputProps } from '../../form/components/multi-action.js';

export type VerifyActions = 'validate' | 'resend';
export interface VerifyActionInputProps extends Omit<MultiActionInputProps, 'value'> {
  value: VerifyActions;
}

export const VerifyActionInput: React.FC<VerifyActionInputProps> = MultiActionInput;
