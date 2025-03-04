import type { AppLoadContext, SessionStorage } from 'react-router';
import type { ProtectedUser } from '../config/db/schema.js';
import type { AuthError } from '../utils/error-auth.js';
import type { Credentials, Verification } from '../utils/valid-auth.js';
export type { UserPassword } from '../config/db/schema.js';
export type SessionContext = {
    user: ProtectedUser;
};
export type ProtectedUserEmail = ProtectedUser['email'];
export declare const resolveSessionStorage: (context: AppLoadContext, request: Request) => Promise<SessionStorage<SessionContext, SessionContext>>;
export declare function sessionStorageFactory(context: AppLoadContext, request: Request): Promise<SessionStorage<SessionContext, SessionContext>>;
type ProtectedUserResponse = [null, user: ProtectedUser, headers: Headers] | [error: Error, undefined, headers: Headers];
export declare const AuthSession: {
    getSessionUser: (context: AppLoadContext, request: Request) => Promise<[ProtectedUser | null]>;
    isAuthenticated: (context: AppLoadContext, request: Request) => Promise<boolean>;
    notAuthenticated: (context: AppLoadContext, request: Request) => Promise<boolean>;
    isSessionUser: (context: AppLoadContext, request: Request, email: ProtectedUser["email"]) => Promise<boolean>;
    sendVerification: (context: AppLoadContext, request: Request, userEmail: ProtectedUser["email"]) => Promise<void>;
    setSessionUser: (context: AppLoadContext, request: Request, strategy: string) => Promise<ProtectedUserResponse>;
    unsetSessionUser: (context: AppLoadContext, request: Request) => Promise<[headers: Headers]>;
    destroySessionUser: (context: AppLoadContext, request: Request) => Promise<[AuthError, undefined] | [null, Headers]>;
    verifySessionUser: (context: AppLoadContext, request: Request, verify: Verification) => Promise<[AuthError, Headers] | [null, Headers]>;
    updateUserPassword: (context: AppLoadContext, request: Request, credentials: Credentials) => Promise<ProtectedUserResponse>;
};
//# sourceMappingURL=auth-session.server.d.ts.map