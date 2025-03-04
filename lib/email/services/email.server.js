/**
 * Source: https://github.com/epicweb-dev/epic-stack
 * Source code adapted for this template.
 */
// import sgMail from '@sendgrid/mail';
// import { z } from 'zod';
import { contextEnv } from '../../common/services/env.js';
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
    // resend: async ({ message, options }: { message: EmailMessage; options: EmailOptions }) => {
    //   const API_URL = 'https://api.resend.com/emails';
    //   const emailBody: EmailBody = {
    //     from: options.from,
    //     to: options.to,
    //     subject: message.subject,
    //     text: message.text,
    //     html: message.html,
    //   };
    //   const response = await fetch(API_URL, {
    //     method: 'POST',
    //     headers: {
    //       Authorization: `Bearer ${options.apikey}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(emailBody),
    //   });
    //   const data = await response.json();
    //   if (!response.ok) {
    //     console.error(data);
    //     throw new Error('Unable to send email.');
    //   }
    //   const parsedData = ResendSuccessSchema.safeParse(data);
    //   if (!parsedData.success) {
    //     const parseError = ResendErrorSchema.safeParse(data);
    //     if (parseError.success) {
    //       console.error(parseError.data);
    //       throw new Error('Unable to send email.');
    //     }
    //     throw new Error('Unable to send email.');
    //   }
    //   return { status: 'success', data: parsedData } as const;
    // },
    //
    // const data = await response.json();
    // const parsedData = ResendSuccessSchema.safeParse(data);
    //   if (response.ok && parsedData.success) {
    //     return { status: 'success', data: parsedData } as const;
    //   } else {
    //     const parseResult = ResendErrorSchema.safeParse(data);
    //     if (parseResult.success) {
    //       console.error(parseResult.data);
    //       throw new Error('Unable to send email.');
    //   }
    //   console.error(data);
    //   throw new Error('Unable to send email.');
    // },
};
export const emailOptions = async (to, context) => {
    const emailApiKey = contextEnv(context).EMAIL_API_KEY;
    if (!emailApiKey || !emailApiKey.includes('||')) {
        throw new Error('Invalid EMAIL_API_KEY format. Expected format: "from||apiKey".');
    }
    const [from, apiKey] = emailApiKey.split('||');
    return {
        from: from,
        to: to,
        apikey: apiKey,
    };
};
//# sourceMappingURL=email.server.js.map