import type { AppLoadContext } from 'react-router';
import { Authenticator } from 'remix-auth';
import type { ProtectedUser } from '../config/db/schema.js';
import { AuthError } from '../utils/error-auth.js';
export declare const resolveAuthenticator: (context: AppLoadContext) => Authenticator<[AuthError, undefined] | [null, ProtectedUser]>;
//# sourceMappingURL=authenticator.server.d.ts.map