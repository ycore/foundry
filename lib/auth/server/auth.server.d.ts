import { type ActionFunctionArgs, type LoaderFunctionArgs, type UNSAFE_DataWithResponseInit } from 'react-router';
import type { VerifyActionInputProps } from '../components/VerifyActionInput.js';
import { type AuthConfigPromise } from '../config/resolve-config.js';
import { type ProtectedUserEmail } from '../server/auth-session.server.js';
type VerifyActionData = {
    errors?: {
        email?: ProtectedUserEmail | [ProtectedUserEmail, ...ProtectedUserEmail[]];
        code?: [string, ...string[]];
        form?: [string, ...string[]];
    };
};
type AuthActionData = {
    errors?: {
        email?: ProtectedUserEmail | [ProtectedUserEmail, ...ProtectedUserEmail[]];
    };
};
interface AuthHandlers {
    signinAction: ({ ...args }: ActionFunctionArgs) => Promise<Response | UNSAFE_DataWithResponseInit<AuthActionData>>;
    signinLoader: ({ ...args }: LoaderFunctionArgs) => Promise<{
        authConfig: AuthConfigPromise;
    }>;
    signoutAction: ({ ...args }: LoaderFunctionArgs) => Promise<Response>;
    signupAction: ({ ...args }: ActionFunctionArgs) => Promise<Response | UNSAFE_DataWithResponseInit<AuthActionData>>;
    signupLoader: ({ ...args }: LoaderFunctionArgs) => Promise<{
        authConfig: AuthConfigPromise;
    }>;
    forgotAction: ({ ...args }: ActionFunctionArgs) => Promise<Response | UNSAFE_DataWithResponseInit<AuthActionData>>;
    forgotLoader: ({ ...args }: LoaderFunctionArgs) => Promise<{
        authConfig: AuthConfigPromise;
    }>;
    verifyAction: ({ ...args }: ActionFunctionArgs) => Promise<Response | UNSAFE_DataWithResponseInit<VerifyActionData> | undefined>;
    verifyLoader: ({ ...args }: LoaderFunctionArgs) => Promise<{
        action: VerifyActionInputProps['value'];
        code?: string;
        email?: ProtectedUserEmail;
    }>;
    confirmLoader: ({ ...args }: LoaderFunctionArgs) => Promise<Response>;
    destroyUserAction: ({ ...args }: ActionFunctionArgs) => Promise<Response>;
}
export declare const Auth: AuthHandlers;
export {};
//# sourceMappingURL=auth.server.d.ts.map