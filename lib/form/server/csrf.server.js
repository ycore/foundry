import { createCookie } from 'react-router';
import { CSRF, CSRFError } from 'remix-utils/csrf/server';
import { contextEnv, isProduction } from '../../common/services/env.js';
export function createCSRF(context) {
    const cookie = createCookie('csrf', {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secrets: [contextEnv(context).CSRF_COOKIE_SECRET_KEY],
        secure: isProduction(context),
    });
    return new CSRF({
        cookie,
        formDataKey: 'csrf',
        secret: contextEnv(context).CSRF_COOKIE_SECRET_KEY,
    });
}
export async function checkCsrfToken(context, data, headers) {
    const csrf = createCSRF(context);
    try {
        await csrf.validate(data, headers);
    }
    catch (error) {
        if (error instanceof CSRFError) {
            throw new Response('CSRF token failure', { status: 403 });
        }
        throw error;
    }
}
//# sourceMappingURL=csrf.server.js.map