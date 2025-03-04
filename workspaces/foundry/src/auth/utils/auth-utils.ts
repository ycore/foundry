import { base64Encode } from '../../common/utils/crypto.js';
import type { VerifyActions } from '../components/VerifyActionInput.js';

export const createVerifyUrl = (link: string, code?: string, email?: string) => {
  const action: VerifyActions = 'validate';
  const token = base64Encode(JSON.stringify({ action, code, email }));
  return `${link}/${token}`;
};
