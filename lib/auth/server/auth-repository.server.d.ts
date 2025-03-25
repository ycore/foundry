import type { AppLoadContext } from 'react-router';
import type { ProtectedUser } from '../config/db/schema.js';
import { AuthError } from '../utils/error-auth.js';
import type { Credentials } from '../utils/valid-auth.js';
type Error_ProtectedUser = Promise<[AuthError, undefined] | [null, ProtectedUser]>;
export declare const authRepository: {
    findOrCreate: (context: AppLoadContext, credentials: Credentials, canExist?: boolean) => Error_ProtectedUser;
    findOrCreateHashed: (context: AppLoadContext, credentials: Credentials, canExist?: boolean) => Error_ProtectedUser;
    findOneEmail: (context: AppLoadContext, email: ProtectedUser["email"]) => Error_ProtectedUser;
    findOneId: (context: AppLoadContext, id: ProtectedUser["id"]) => Error_ProtectedUser;
    findOneHashed: (context: AppLoadContext, credentials: Credentials) => Error_ProtectedUser;
    delete: (context: AppLoadContext, id: ProtectedUser["id"]) => Promise<[AuthError, undefined] | [null, boolean]>;
    updateUserVerified: (context: AppLoadContext, email: ProtectedUser["email"], verified: boolean) => Error_ProtectedUser;
    updateStoredPassword: (context: AppLoadContext, email: ProtectedUser["email"], password: string) => Error_ProtectedUser;
};
export {};
//# sourceMappingURL=auth-repository.server.d.ts.map