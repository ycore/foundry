/**
 * Source: https://github.com/epicweb-dev/epic-stack
 * Source code adapted for this template.
 */
import type { AppLoadContext } from 'react-router';
export interface EmailOptions {
    from: string;
    to: string | string[];
    apikey: string;
}
export interface EmailMessage {
    subject: string;
    html: string;
    text?: string;
}
export declare const sendMail: {
    mailersend: ({ message, options }: {
        message: EmailMessage;
        options: EmailOptions;
    }) => Promise<{
        readonly status: "success";
        readonly data: any;
    }>;
    resend: ({ message, options }: {
        message: EmailMessage;
        options: Omit<EmailOptions, "to" & {
            to: string;
        }>;
    }) => Promise<{
        readonly status: "success";
        readonly data: any;
    }>;
    sendgridapi: ({ message, options }: {
        message: EmailMessage;
        options: EmailOptions;
    }) => Promise<{
        readonly status: "success";
        readonly data: any;
    }>;
};
export declare const emailOptions: (to: string, context: AppLoadContext) => Promise<EmailOptions>;
//# sourceMappingURL=email.server.d.ts.map