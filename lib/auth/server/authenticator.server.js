import { Authenticator } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';
import { safeParseForm } from '../../form/validate.js';
import { authRepository } from '../server/auth-repository.server.js';
import { AuthError } from '../utils/error-auth.js';
import { CredentialSchema } from '../utils/valid-auth.js';
export const resolveAuthenticator = (() => {
    let lazyAuthInstance;
    // biome-ignore lint/suspicious/noAssignInExpressions:
    return (context) => (lazyAuthInstance ??= authenticatorFactory(context));
})();
function authenticatorFactory(context) {
    const authenticator = new Authenticator();
    authenticator.use(new FormStrategy(async ({ form }) => {
        const parsed = safeParseForm(CredentialSchema, form, ['email', 'password']);
        if (parsed.errors || !parsed.data) {
            return [new AuthError('SIGNIN VALIDATION', JSON.stringify(parsed.errors)), undefined];
        }
        const [error, user] = await authRepository.findOneHashed(context, parsed.data);
        if (error) {
            return [error, undefined];
        }
        return [null, user];
    }), 'signin-strategy');
    authenticator.use(new FormStrategy(async ({ form }) => {
        const parsed = safeParseForm(CredentialSchema, form, ['email', 'password']);
        if (parsed.errors || !parsed.data) {
            return [new AuthError('SIGNIN VALIDATION', JSON.stringify(parsed.errors)), undefined];
        }
        const [error, user] = await authRepository.findOrCreateHashed(context, parsed.data);
        if (error) {
            return [error, undefined];
        }
        return [null, user];
    }), 'signup-strategy');
    return authenticator;
}
