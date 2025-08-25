import type { TypedResult } from '@ycore/forge/error';

export interface CSRFOptions {
  secret?: string;
  cookieName?: string;
  formDataKey?: string;
  secure?: boolean;
}

export type CSRFValidationResult = TypedResult<boolean>;
