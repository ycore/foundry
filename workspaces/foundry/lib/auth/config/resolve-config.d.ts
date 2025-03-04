/**
 * Resolves the authentication configuration lazily.
 * @returns {Promise<AuthConfig>} A promise that resolves to the authentication configuration.
 */
export declare const resolveAuthConfig: () => Promise<{
    cookie: {
        maxAge: number;
    };
    email: {
        send: boolean;
        active: string;
        DEV_TO: any;
    };
    totp: {
        digits: number;
        period: number;
        maxAttempts: number;
    };
    routes: {
        landing: string;
        auth: {
            signin: string;
            signup: string;
            signout: string;
            verify: string;
            confirm: string;
            forgot: string;
            delete: string;
            signedin: string;
            signedout: string;
        };
    };
    DEV_SIGNIN: {
        username: any;
        password: any;
    };
    custom: {
        filepath: string;
    };
}>;
export type AuthConfigPromise = Awaited<ReturnType<typeof resolveAuthConfig>>;
//# sourceMappingURL=resolve-config.d.ts.map