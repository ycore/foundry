export type Senders = 'sendgridapi' | 'resend' | 'mailersend';
declare const authConfig: {
    cookie: {
        maxAge: number;
    };
    email: {
        send: boolean;
        active: Senders;
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
    DEV: {
        email_to: string;
        username: string;
        password: string;
    };
};
export default authConfig;
export type AuthConfig = typeof authConfig;
//# sourceMappingURL=config.auth.d.ts.map