import { parseIssues, returnFailure, returnSuccess } from '@ycore/forge/error';
import type { ValidationResult } from '@ycore/forge/utils';
import { logger } from '@ycore/forge/utils';
import * as v from 'valibot';

export const EmailSchema = v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email(), v.maxLength(254));

export type ValidEmail = v.InferOutput<typeof EmailSchema>;

export async function validateEmail(email: string): Promise<ValidationResult<typeof EmailSchema>> {
  const result = v.safeParse(EmailSchema, email);

  if (result.success) {
    logger.debug({
      event: 'email_validation_success',
      email: result.output,
    });

    return returnSuccess(result.output);
  }

  return returnFailure(parseIssues(result.issues));
}
