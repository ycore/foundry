import { BaseError } from '../../common/utils/error-base.js';

type ErrorKind =
  | 'DB USER CREATE FAILED'
  | 'DB USER CREDENTIALS'
  | 'DB USER DELETE FAILED'
  | 'DB USER EXISTS'
  | 'DB USER FIND FAILED'
  | 'DB USER PASSWORD UPDATE FAILED'
  | 'DB USER UPDATE FAILED'
  | 'FORGOT EMAIL INVALID'
  | 'REQUIRED SECRET'
  | 'RESET VALIDATION'
  | 'RESET VERIFICATION'
  | 'SIGNIN ERROR'
  | 'SIGNIN VALIDATION'
  | 'SIGNUP ERROR'
  | 'SIGNUP VALIDATION'
  | 'TOTP ATTEMPTS'
  | 'TOTP EXPIRED'
  | 'TOTP INVALID'
  | 'USER VERIFICATION'
  | 'VERIFICATION FAILURE';

export const AUTH_ERRORS = {
  TOTP_SECRET: 'TOTP secret is required',
  TOTP_EXPIRED: 'TOTP code has expired',
  TOTP_INVALID: 'TOTP INVALID code',
  TOTP_ATTEMPTS: 'Maximum verification attempts reached',
} as const;

export class AuthError extends BaseError<ErrorKind> {
  constructor(...args: ConstructorParameters<typeof BaseError<ErrorKind>>) {
    super(...args);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export type AuthErrorType = typeof AuthError;
