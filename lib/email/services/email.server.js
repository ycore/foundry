/**
 * Source: https://github.com/epicweb-dev/epic-stack
 * Source code adapted for this template.
 */
import { array, object, optional, string, union } from 'valibot';
import { contextEnv } from '../../common/services/env.js';
import { safeParse } from '../../form/validate.js';
const EmailMessageSchema = object({
    subject: string(),
    html: string(),
    text: optional(string()),
});
const EmailOptionsSchema = object({
    from: string(),
    to: union([string(), array(string())]),
    apikey: string(),
});
export const sendMail = {
    mailersend: async ({ message, options }) => {
        const API_URL = 'https://api.mailersend.com/v1/email';
        const emailBody = {
            from: { email: options.from },
            to: [{ email: options.to }],
            subject: message.subject,
            html: message.html || '',
            text: message.text || '',
        };
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${options.apikey}`,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(emailBody),
        });
        const rawResponse = await response.text();
        const data = rawResponse ? JSON.parse(rawResponse) : null;
        if (!response.ok) {
            console.error('Error Data:', data || rawResponse);
            throw new Error('Unable to send email.');
        }
        return { status: 'success', data };
    },
    resend: async ({ message, options }) => {
        const API_URL = 'https://api.resend.com/emails';
        const ResendOptionsSchema = object({
            ...EmailOptionsSchema.entries,
            to: string(),
        });
        const validatedMessage = safeParse(EmailMessageSchema, message);
        const validatedOptions = safeParse(ResendOptionsSchema, options);
        if (!validatedMessage.success) {
            console.error(validatedMessage.errors);
            return;
        }
        if (!validatedOptions.success) {
            console.error(validatedOptions.errors);
            return;
        }
        const emailBody = {
            from: validatedOptions.data.from,
            to: validatedOptions.data.to,
            subject: validatedMessage.data.subject,
            html: validatedMessage.data.html || '',
            text: validatedMessage.data.text || '',
        };
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${validatedOptions.data.apikey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailBody),
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Error Data:', data);
            throw new Error('Unable to send email.');
        }
        return { status: 'success', data };
    },
    // https://github.com/sendgrid/sendgrid-nodejs
    // sendgrid: async ({ message, options }: { message: EmailMessage; options: EmailOptions }) => {
    //   sgMail.setApiKey(options.apikey);
    //   const emailBody: EmailBody = {
    //     from: options.from,
    //     to: options.to,
    //     subject: message.subject,
    //     text: message.text,
    //     html: message.html,
    //   };
    //   sgMail
    //     .send(emailBody)
    //     .then(() => {
    //       console.log('Email sent');
    //     })
    //     .catch((error) => {
    //       console.error(error);
    //     });
    // },
    sendgridapi: async ({ message, options }) => {
        const API_URL = 'https://api.sendgrid.com';
        const emailBody = {
            personalizations: [{ to: [{ email: options.to }], subject: message.subject }],
            from: { email: options.from },
            content: [
                { type: 'text/plain', value: message.text || '' },
                { type: 'text/html', value: message.html || '' },
            ],
        };
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${options.apikey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailBody),
        });
        const data = await response.json();
        if (!response.ok) {
            console.error(data);
            throw new Error('Unable to send email.');
        }
        return { status: 'success', data };
    },
};
export const emailOptions = async (to, context) => {
    const emailApiKey = contextEnv(context).EMAIL_API_KEY;
    if (!emailApiKey || !emailApiKey.includes('||')) {
        throw new Error('Invalid EMAIL_API_KEY format. Expected format: "from||apiKey".');
    }
    const [from, apiKey] = emailApiKey.split('||');
    const validatedOptions = safeParse(EmailOptionsSchema, { from, to, apikey: apiKey });
    if (!validatedOptions.success) {
        console.error(validatedOptions.errors);
        throw new Error('Invalid Email Options format');
    }
    return validatedOptions.data;
};
