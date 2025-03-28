import { BaseError } from '../../common/utils/error-base.js';
type ErrorKind = 'DB USER CREATE FAILED' | 'DB USER CREDENTIALS' | 'DB USER DELETE FAILED' | 'DB USER EXISTS' | 'DB USER FIND FAILED' | 'DB USER PASSWORD UPDATE FAILED' | 'DB USER UPDATE FAILED' | 'FORGOT EMAIL INVALID' | 'REQUIRED SECRET' | 'RESET VALIDATION' | 'RESET VERIFICATION' | 'SIGNIN ERROR' | 'SIGNIN VALIDATION' | 'SIGNUP ERROR' | 'SIGNUP VALIDATION' | 'TOTP ATTEMPTS' | 'TOTP EXPIRED' | 'TOTP INVALID' | 'USER VERIFICATION' | 'VERIFICATION FAILURE';
export declare const AUTH_ERRORS: {
    readonly TOTP_SECRET: "TOTP secret is required";
    readonly TOTP_EXPIRED: "TOTP code has expired";
    readonly TOTP_INVALID: "TOTP INVALID code";
    readonly TOTP_ATTEMPTS: "Maximum verification attempts reached";
};
export declare class AuthError extends BaseError<ErrorKind> {
    constructor(...args: ConstructorParameters<typeof BaseError<ErrorKind>>);
}
export type AuthErrorType = typeof AuthError;
export {};
