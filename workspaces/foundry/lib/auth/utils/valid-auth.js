import * as v from 'valibot';
const DEFAULTS = {
    REQUIRE: {
        PASSWORD_MIN: 8,
        OTP_MIN: 6,
    },
    MESSAGE: {
        EMAIL: 'Please enter a valid email address',
        PASSWORD: 'Please enter a valid password',
    },
};
export const CredentialSchema = v.object({
    email: v.pipe(v.string(DEFAULTS.MESSAGE.EMAIL), v.nonEmpty(DEFAULTS.MESSAGE.EMAIL), v.email(DEFAULTS.MESSAGE.EMAIL), v.trim(), v.toLowerCase()),
    password: v.pipe(v.string(DEFAULTS.MESSAGE.PASSWORD), v.nonEmpty(DEFAULTS.MESSAGE.PASSWORD), v.minLength(DEFAULTS.REQUIRE.PASSWORD_MIN, `The password must have ${DEFAULTS.REQUIRE.PASSWORD_MIN} characters or more.`), v.trim()),
});
export const VerificationSchema = v.object({
    email: v.pipe(v.string(DEFAULTS.MESSAGE.EMAIL), v.nonEmpty(DEFAULTS.MESSAGE.EMAIL), v.email(DEFAULTS.MESSAGE.EMAIL), v.trim(), v.toLowerCase()),
    code: v.pipe(v.string(), v.regex(/^\d{6}$/u, 'OTP code format is invalid')),
});
//# sourceMappingURL=valid-auth.js.map