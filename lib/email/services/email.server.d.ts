/**
 * Source: https://github.com/epicweb-dev/epic-stack
 * Source code adapted for this template.
 */
import type { AppLoadContext } from 'react-router';
import { type InferOutput } from 'valibot';
declare const EmailMessageSchema: import("valibot").ObjectSchema<{
    readonly subject: import("valibot").StringSchema<undefined>;
    readonly html: import("valibot").StringSchema<undefined>;
    readonly text: import("valibot").OptionalSchema<import("valibot").StringSchema<undefined>, never>;
}, undefined>;
declare const EmailOptionsSchema: import("valibot").ObjectSchema<{
    readonly from: import("valibot").StringSchema<undefined>;
    readonly to: import("valibot").UnionSchema<[import("valibot").StringSchema<undefined>, import("valibot").ArraySchema<import("valibot").StringSchema<undefined>, undefined>], undefined>;
    readonly apikey: import("valibot").StringSchema<undefined>;
}, undefined>;
type EmailMessage = InferOutput<typeof EmailMessageSchema>;
type EmailOptions = InferOutput<typeof EmailOptionsSchema>;
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
    } | undefined>;
    sendgridapi: ({ message, options }: {
        message: EmailMessage;
        options: EmailOptions;
    }) => Promise<{
        readonly status: "success";
        readonly data: any;
    }>;
};
export declare const emailOptions: (to: string, context: AppLoadContext) => Promise<EmailOptions>;
export {};
