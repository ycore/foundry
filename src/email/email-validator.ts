import { logger } from "@ycore/forge/utils";
import * as v from "valibot";

export const EmailSchema = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.email(),
  v.maxLength(254)
);

export type ValidEmail = v.InferOutput<typeof EmailSchema>;

export async function validateEmail(email: string): Promise<boolean> {
  try {
    v.parse(EmailSchema, email);

    logger.debug({
      event: "email_validation_success",
      email: email.trim().toLowerCase()
    });

    return true;
  } catch (error) {
    const issues = v.isValiError(error) ? error.issues : [];
    const reason = issues.length > 0 ? issues[0].message : "validation_failed";

    logger.warn({
      event: "email_validation_failed",
      reason,
      email: typeof email === 'string' ? email.trim().toLowerCase() : typeof email,
      issues: issues.map(issue => ({ message: issue.message, path: issue.path }))
    });

    return false;
  }
}
