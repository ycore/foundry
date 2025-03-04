import { type AppLoadContext } from 'react-router';
import { CSRF } from 'remix-utils/csrf/server';
export declare function createCSRF(context: AppLoadContext): CSRF;
export declare function checkCsrfToken(context: AppLoadContext, data: FormData, headers: Headers): Promise<void>;
//# sourceMappingURL=csrf.server.d.ts.map