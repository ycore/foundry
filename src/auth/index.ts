export type { AuthConfig, AuthRoutes } from './@types/auth.config.types';
export type { SessionData, SessionFlashData, UserDetails, WebAuthnOptionsResponse } from './@types/auth.types';
export { defaultAuthConfig } from './auth.config';
export { AuthForm, SimpleAuthForm } from './components/auth-form';
export { handleFormSubmit } from './components/auth-form-handler';
