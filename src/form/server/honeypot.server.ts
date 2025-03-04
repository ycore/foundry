import type { AppLoadContext } from 'react-router';
import { Honeypot, SpamError } from 'remix-utils/honeypot/server';

import { contextEnv } from '../../common/services/env.js';

export function createHoneypot(context: AppLoadContext) {
  return new Honeypot({
    validFromFieldName: contextEnv(context).ENVIRONMENT === 'testing' ? null : undefined,
    encryptionSeed: contextEnv(context).HONEYPOT_SECRET_KEY,
  });
}

export async function checkHoneypot(context: AppLoadContext, formData: FormData) {
  const honeypot = createHoneypot(context);
  try {
    honeypot.check(formData);
  } catch (error) {
    if (error instanceof SpamError) {
      throw new Response('Form submit failure', { status: 400 });
    }
    throw error;
  }
}
