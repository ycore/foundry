import type { TypedResult } from '@ycore/forge/http';

export interface CSRFOptions {
  secret?: string;
  cookieName?: string;
  formDataKey?: string;
  secure?: boolean;
}

export interface CSRFData {
  token: string;
  validated?: boolean;
  needsValidation?: boolean;
}

export type CSRFValidationResult = TypedResult<boolean>;
