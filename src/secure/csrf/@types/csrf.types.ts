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
