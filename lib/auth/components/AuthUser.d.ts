import type { AuthConfig } from '../config/config.auth.js';
import type { ProtectedUser } from '../config/db/schema.js';
interface AuthUserProps {
    user: ProtectedUser | null;
    authConfig: AuthConfig;
}
export declare function AuthUser({ user, authConfig }: AuthUserProps): import("react/jsx-runtime").JSX.Element;
export {};
