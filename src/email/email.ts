import type { SendEmailOptions } from "./@types/email.types";
import { ResendEmailProvider } from "./providers/resend";
import { createTotpTemplate } from "./templates/auth-totp";

const emailProvider = new ResendEmailProvider();

/**
 * Send email using configured provider
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  return emailProvider.sendEmail(options);
}

/**
 * Send TOTP authentication email
 */
export async function sendAuthTotpEmail(params: {
  env: Env;
  email: string;
  code: string;
  from: string;
}): Promise<void> {
  const { env, email, code, from } = params;

  return await sendEmail({
    apiKey: env.EMAIL_API_KEY,
    to: email,
    from,
    template: createTotpTemplate({ code }),
  });
}
