import type { AppLoadContext } from 'react-router';
import { Authenticator } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';

import { safeParseForm } from '../../form/validate.js';
import type { ProtectedUser } from '../config/db/schema.js';
import { authRepository } from '../server/auth-repository.server.js';
import { AuthError } from '../utils/error-auth.js';
import { CredentialSchema } from '../utils/valid-auth.js';

export const resolveAuthenticator = (() => {
  let lazyAuthInstance: ReturnType<typeof authenticatorFactory> | undefined;

  // biome-ignore lint/suspicious/noAssignInExpressions:
  return (context: AppLoadContext) => (lazyAuthInstance ??= authenticatorFactory(context));
})();

function authenticatorFactory(context: AppLoadContext) {
  const authenticator = new Authenticator<[AuthError, undefined] | [null, ProtectedUser]>();

  authenticator.use(
    new FormStrategy(async ({ form }: { form: FormData }) => {
      const parsed = safeParseForm(CredentialSchema, form, ['email', 'password']);
      if (parsed.errors || !parsed.data) {
        return [new AuthError('SIGNIN VALIDATION', JSON.stringify(parsed.errors)), undefined];
      }

      const [error, user] = await authRepository.findOneHashed(context, parsed.data);

      if (error) {
        return [error, undefined];
      }
      return [null, user];
    }),
    'signin-strategy'
  );

  authenticator.use(
    new FormStrategy(async ({ form }: { form: FormData }) => {
      const parsed = safeParseForm(CredentialSchema, form, ['email', 'password']);
      if (parsed.errors || !parsed.data) {
        return [new AuthError('SIGNIN VALIDATION', JSON.stringify(parsed.errors)), undefined];
      }
      const [error, user] = await authRepository.findOrCreateHashed(context, parsed.data);

      if (error) {
        return [error, undefined];
      }
      return [null, user];
    }),
    'signup-strategy'
  );

  return authenticator;
}
