import { BaseError } from '../../common/utils/error-base.js';
export const AUTH_ERRORS = {
    TOTP_SECRET: 'TOTP secret is required',
    TOTP_EXPIRED: 'TOTP code has expired',
    TOTP_INVALID: 'TOTP INVALID code',
    TOTP_ATTEMPTS: 'Maximum verification attempts reached',
};
export class AuthError extends BaseError {
    constructor(...args) {
        super(...args);
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}
